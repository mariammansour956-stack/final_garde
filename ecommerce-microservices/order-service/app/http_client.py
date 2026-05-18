import logging

import httpx

from app.config import settings

logger = logging.getLogger(settings.service_name)


async def send_notification(user_id: str, notification_type: str, title: str, message: str, metadata: dict | None = None) -> None:
    """Call notification-service to send a notification. Log error but do not raise."""
    payload = {
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "metadata": metadata or {},
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.notification_service_url}/notifications/send",
                json=payload,
            )
            if response.is_success:
                logger.info("Notification sent: user_id=%s type=%s", user_id, notification_type)
            else:
                logger.warning(
                    "Notification service returned %s: %s",
                    response.status_code,
                    response.text,
                )
    except httpx.RequestError as exc:
        logger.error("Failed to send notification: %s", exc)
