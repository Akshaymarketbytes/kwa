from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authapp.urls')),
    path('api/area/', include('area.urls')),
    path('api/complaint/', include('complaints.urls')),
    path('documentation/', include('documentation.urls')),
    path('api/connectiontype/', include('connectiontype.urls')),
    path('api/conversion/', include('conversion.urls')),
    path('api/valve/', include('valves.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
