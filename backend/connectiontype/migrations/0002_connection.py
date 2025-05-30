# Generated by Django 5.1.5 on 2025-04-22 12:40

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('connectiontype', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Connection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('address', models.TextField()),
                ('file_number', models.CharField(max_length=50, unique=True)),
                ('area', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('assistant_engineer', 'Assistant Engineer'), ('fo', 'FO'), ('site_inspector', 'Site Inspector'), ('completed', 'Completed')], max_length=20)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('connection_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='connectiontype.connectiontype')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
