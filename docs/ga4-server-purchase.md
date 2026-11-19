# GA4 purchase from the Paystack webhook (backend)

The frontend now sends `purchase` on the Paystack return page and on the order page, once per order per browser.
A customer who pays and closes the tab before the return page loads is still missed. To catch those,
send the same event from the backend when the Paystack webhook marks an order paid.

1. In GA4: Admin → Data streams → Web → Measurement Protocol API secrets → Create. Put it in the backend env as
   `GA4_API_SECRET`, and the measurement ID as `GA4_MEASUREMENT_ID`. Never in the frontend.
2. Call this after `charge.success` is verified and the order is saved as paid:

```python
import os, uuid, requests

def send_ga4_purchase(order):
    mid, secret = os.environ.get("GA4_MEASUREMENT_ID"), os.environ.get("GA4_API_SECRET")
    if not (mid and secret) or float(order.total_amount) <= 0:
        return
    payload = {
        # Use the browser's GA client id if the order stored it; otherwise a stable fallback.
        "client_id": getattr(order, "ga_client_id", None) or f"server.{uuid.uuid5(uuid.NAMESPACE_URL, order.reference_code)}",
        "events": [{
            "name": "purchase",
            "params": {
                "transaction_id": order.reference_code,  # same id as the frontend, so GA4 de-duplicates
                "value": float(order.total_amount),
                "currency": "GHS",
                "shipping": float(order.delivery_cost or 0) + float(order.pickup_cost or 0),
                "payment_type": "paystack",
                "items": [{
                    "item_id": str(i.service_id), "item_name": i.service.name,
                    "price": float(i.unit_price), "quantity": i.quantity,
                } for i in order.items.all()],
            },
        }],
    }
    try:
        requests.post(
            f"https://www.google-analytics.com/mp/collect?measurement_id={mid}&api_secret={secret}",
            json=payload, timeout=4,
        )
    except requests.RequestException:
        pass  # analytics must never break payment handling
```

Both sides use `reference_code` as `transaction_id`, so an order tracked by both is counted once.
