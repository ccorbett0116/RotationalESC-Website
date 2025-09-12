# Generated migration for purchase tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='popularproduct',
            name='purchases',
            field=models.PositiveIntegerField(default=0, help_text='Actual purchases'),
        ),
        migrations.AddField(
            model_name='popularproduct',
            name='purchase_rate',
            field=models.FloatField(default=0.0, help_text='Purchases / unique views'),
        ),
    ]