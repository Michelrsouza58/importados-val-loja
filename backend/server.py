import os
import json
import urllib.request
import urllib.error
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


class ItemPedido(BaseModel):
    title: str
    quantity: int = Field(gt=0, le=50)
    unit_price: float = Field(gt=0)


class PreferenciaRequest(BaseModel):
    items: list[ItemPedido]
    payerEmail: Optional[str] = ""
    origin: Optional[str] = ""
    orderNsu: Optional[str] = ""


def _http_json(url: str, method: str = "GET", payload: dict | None = None, headers: dict | None = None, timeout: int = 20):
    dados = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=dados, method=method)
    req.add_header("Content-Type", "application/json")
    for chave, valor in (headers or {}).items():
        req.add_header(chave, valor)
    with urllib.request.urlopen(req, timeout=timeout) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def _token_do_firebase() -> str:
    """Lê o token do Mercado Pago salvo no painel admin (configuracoes/pagamentos)."""
    db_url = os.environ.get("FIREBASE_DB_URL", "")
    if not db_url:
        return ""
    try:
        dados = _http_json(f"{db_url.rstrip('/')}/configuracoes/pagamentos.json")
        return str((dados or {}).get("mercadoPagoAccessToken") or "")
    except Exception:
        return ""


@app.post("/api/mercadopago/create-preference")
async def criar_preferencia(req: PreferenciaRequest):
    token = os.environ.get("MP_ACCESS_TOKEN", "") or _token_do_firebase()
    if not token:
        return {
            "error": "O Mercado Pago ainda não foi configurado. Defina o Access Token no painel admin (aba Pagamentos) ou na variável MP_ACCESS_TOKEN."
        }

    total = round(sum(i.unit_price * i.quantity for i in req.items), 2)
    origem = (req.origin or "").rstrip("/")

    preferencia = {
        "items": [
            {
                "title": item.title[:120],
                "quantity": item.quantity,
                "currency_id": "BRL",
                "unit_price": round(item.unit_price, 2),
            }
            for item in req.items
        ],
        "external_reference": (req.orderNsu or "")[:64],
    }
    if origem:
        preferencia["back_urls"] = {
            "success": f"{origem}/meus-pedidos",
            "failure": f"{origem}/meus-pedidos",
            "pending": f"{origem}/meus-pedidos",
        }
        preferencia["auto_return"] = "approved"
    if req.payerEmail:
        preferencia["payer"] = {"email": req.payerEmail}

    try:
        resposta = _http_json(
            "https://api.mercadopago.com/checkout/preferences",
            method="POST",
            payload=preferencia,
            headers={"Authorization": f"Bearer {token}"},
        )
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", errors="ignore")[:300]
        return {"error": f"Mercado Pago recusou a preferência ({erro.code}). Verifique o token. {detalhe}"}
    except Exception as erro:
        return {"error": "Falha de conexão com o Mercado Pago. Tente novamente."}

    init_point = resposta.get("init_point") or resposta.get("sandbox_init_point") or ""
    if not init_point:
        return {"error": "Mercado Pago não retornou o link de pagamento."}

    return {"initPoint": init_point, "preferenceId": resposta.get("id", ""), "total": total}
