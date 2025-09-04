# Generated manually on 2025-09-03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        # Remove shipping-related fields
        migrations.RemoveField(
            model_name='order',
            name='shipping_amount',
        ),
        migrations.RemoveField(
            model_name='order',
            name='shipping_method',
        ),
        migrations.RemoveField(
            model_name='order',
            name='tracking_number',
        ),
        # Update country fields to use choices and shorter max_length
        migrations.AlterField(
            model_name='order',
            name='billing_country',
            field=models.CharField(choices=[('US', 'United States'), ('CA', 'Canada')], default='US', max_length=2),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_country',
            field=models.CharField(choices=[('US', 'United States'), ('CA', 'Canada')], default='US', max_length=2),
        ),
    ]
