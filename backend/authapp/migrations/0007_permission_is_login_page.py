# Generated by Django 5.1.7 on 2025-04-16 05:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authapp', '0006_alter_user_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='permission',
            name='is_login_page',
            field=models.BooleanField(default=False),
        ),
    ]
