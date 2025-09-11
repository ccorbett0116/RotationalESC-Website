import uuid
from django.db import migrations, models

def populate_tokens(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    for order in Order.objects.all():
        if not order.confirmation_token:
            order.confirmation_token = str(uuid.uuid4())
            order.save()

class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_confirmation_token"),
    ]

    operations = [
        migrations.RunPython(populate_tokens),
        migrations.AlterField(
            model_name="order",
            name="confirmation_token",
            field=models.CharField(
                max_length=255,
                unique=True,
                null=False,
                blank=False,
            ),
        ),
    ]
