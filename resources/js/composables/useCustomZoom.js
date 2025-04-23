import L from 'leaflet';

export function useCustomZoom() {
    const CustomZoom = L.Control.extend({
        options: {
            position: 'topright', // Position of the control
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'custom-zoom'); // Create a div for the buttons

            // Zoom In Button
            let zoomIn = L.DomUtil.create('button', 'btn custom-zoom-in', container);
            zoomIn.innerHTML = '<i class="pi pi-plus"></i>';
            zoomIn.onclick = function (e) {
                e.preventDefault();
                map.zoomIn();
            };

            // Zoom Out Button
            let zoomOut = L.DomUtil.create('button', 'btn custom-zoom-out', container);
            zoomOut.innerHTML = '<i class="pi pi-minus"></i>';
            zoomOut.onclick = function (e) {
                e.preventDefault();
                map.zoomOut();
            };

            // Click Events
            L.DomEvent.on(zoomIn, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                map.zoomIn();
            });

            L.DomEvent.on(zoomOut, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                map.zoomOut();
            });

            return container;
        }
    });

    return {
        CustomZoom
    };
}