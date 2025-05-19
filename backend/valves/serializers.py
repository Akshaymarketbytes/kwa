from rest_framework import serializers
from .models import Valve, ValveLog
from area.models import Area

class AreaSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='area_name')

    class Meta:
        model = Area
        fields = ['id', 'name']

class ValveSerializer(serializers.ModelSerializer):
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        source='area',
        allow_null=True,
        write_only=True
    )

    def validate_full_open_condition(self, value):
        if value is not None and not isinstance(value, (int, float)):
            raise serializers.ValidationError("Full open condition must be a number.")
        return value

    def validate_current_condition(self, value):
        if value is not None and not isinstance(value, (int, float)):
            raise serializers.ValidationError("Current condition must be a number.")
        return value

    def validate_mid_point(self, value):
        if value is not None and not isinstance(value, (int, float)):
            raise serializers.ValidationError("Mid-point must be a number between 0 and 1.")
        return value

    def validate_steepness(self, value):
        if value is not None and not isinstance(value, (int, float)):
            raise serializers.ValidationError("Steepness must be a number between 0 and 100.")
        return value

    def validate(self, data):
        current_condition = data.get('current_condition')
        full_open_condition = data.get('full_open_condition', getattr(self.instance, 'full_open_condition', None))

        if current_condition is not None and full_open_condition is not None:
            if float(current_condition) > float(full_open_condition):
                raise serializers.ValidationError({
                    'current_condition': "Current condition must be less than or equal to full open condition."
                })
        return data

    class Meta:
        model = Valve
        fields = [
            'id',
            'name',
            'size',
            'full_open_condition',
            'current_condition',
            'mid_point',
            'steepness',
            'remarks',
            'previous_position',
            'latitude',
            'longitude',
            'area_image',
            'area',
            'area_id',
        ]
        read_only_fields = ['previous_position']

    def create(self, validated_data):
        if 'previous_position' not in validated_data:
            validated_data['previous_position'] = ""
        return super().create(validated_data)

    def update(self, instance, validated_data):
        old_current_condition = instance.current_condition

        for field, new_value in validated_data.items():
            old_value = getattr(instance, field)
            if old_value != new_value:
                ValveLog.objects.create(
                    valve=instance,
                    user=self.context['request'].user,
                    changed_field=field,
                    old_value=str(old_value) if old_value is not None else "",
                    new_value=str(new_value) if new_value is not None else ""
                )

        if 'current_condition' in validated_data:
            instance.previous_position = str(old_current_condition)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

class ValveLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValveLog
        fields = ['id', 'valve', 'user', 'changed_field', 'old_value', 'new_value', 'timestamp']
