# Generated by Django 5.1.7 on 2025-05-16 11:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('valves', '0012_valve_area'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='valve',
            name='area',
        ),
        migrations.AddField(
            model_name='valve',
            name='provide_area',
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
    ]
