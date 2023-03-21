// создание коллекции geoObject
// url: `https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/8/${tile[0]}/${tile[1]}.pbf`
console.log({ window });
let dataTiles = [];
function deleteCopyTiles(array) {
  let temp = [];
  for (let item of array) {
    if (temp.includes(item)) {
      continue;
    } else {
      temp.push(item);
    }
  }
  return temp;
}
function getTileFromCoords(lat, lon, zoom) {
  let projections = [
      {
        name: "wgs84Mercator",
        eccentricity: 0.0818191908426,
      },
      {
        name: "sphericalMercator",
        eccentricity: 0,
      },
    ],
    // Для вычисления номера нужного тайла следует задать параметры:
    // - уровень масштабирования карты;
    // - географические координаты объекта, попадающего в тайл;
    // - проекцию, для которой нужно получить тайл.
    params = {
      z: zoom,
      geoCoords: [lat, lon],
      projection: projections[0],
    };
  let pixelCoords = fromGeoToPixels(
    params.geoCoords[0],
    params.geoCoords[1],
    params.projection,
    params.z
  );
  // Доступные проекции и соответствующие значения эксцентриситетов.

  function fromGeoToPixels(lat, long, projection, z) {
    var x_p,
      y_p,
      pixelCoords,
      tilenumber = [],
      rho,
      pi = Math.PI,
      beta,
      phi,
      theta,
      e = projection.eccentricity;

    rho = Math.pow(2, z + 8) / 2;
    beta = (lat * pi) / 180;
    phi = (1 - e * Math.sin(beta)) / (1 + e * Math.sin(beta));
    theta = Math.tan(pi / 4 + beta / 2) * Math.pow(phi, e / 2);

    x_p = rho * (1 + long / 180);
    y_p = rho * (1 - Math.log(theta) / pi);

    return [x_p, y_p];
  }

  function fromPixelsToTileNumber(x, y) {
    return `${Math.floor(x / 256)}/${Math.floor(y / 256)}`;
  }
  let tileNumber = fromPixelsToTileNumber(pixelCoords[0], pixelCoords[1]);
  return tileNumber;
}

function createFeatures(array) {
  let arrayOfFeatures = [];
  let arrayTiles = [];

  array.map((item) => {
    let temp = getTileFromCoords(Number(item.geo_lat), Number(item.geo_lon), 8);
    arrayTiles.push(temp);
    let linkNumber =
      "<a target='_blank' href='https://rgis.mosreg.ru/v3/#/planning?cadnum=" +
      item.number +
      "'>" +
      "Геопортал подмосковья:" +
      item.number +
      "</a>";
    // let tileButton =
    //   "<button onclick={getTileFromCoords(23.46,45.564,8)}> tile</button>";
    let contentBody =
      "<h4>Кадастровый номер: </h4>" +
      item.number +
      "<h4>Площадь: </h4>" +
      "<p>" +
      item.cad_area +
      "м2" +
      "</p>" +
      "<h4>Назначение: </h4>" +
      "<p>" +
      item.purpose_name +
      "</p>" +
      "<h4> Категория земель: </h4>" +
      "<p>" +
      item.purpose_parsed +
      "</p>" +
      "<h4> Назначение ЗУ РР: </h4>" +
      "<p>" +
      item.purpose_parsed2 +
      "</p>" +
      "<h4> Права и обременения: </h4>" +
      "<p>" +
      item.rights +
      "," +
      item.encumbrances +
      "</p>";

    let feature = {
      type: "Feature",
      id: item.id,
      geometry: {
        type: "Point",
        coordinates: [Number(item.geo_lat), Number(item.geo_lon)],
      },
      properties: {
        area: Number(item.cad_area),
        areaFragment: setFragment(Number(item.cad_area)),
        balloonContentHeader: `Адрес: ${item.address}`,
        balloonContentBody: contentBody,

        balloonContentFooter: linkNumber,

        clusterCaption: item.address,
      },
    };
    arrayOfFeatures.push(feature);
  });
  let filterTiles = deleteCopyTiles(arrayTiles);
  return [arrayOfFeatures, filterTiles];
}
//запуск карты
ymaps.ready(init);

function init() {
  var myMap = new ymaps.Map(
      "map",
      {
        center: [55.76, 37.64],
        zoom: 8,
      },
      {
        searchControlProvider: "yandex#search",
      }
    ),
    objectManager = new ymaps.ObjectManager({
      // Чтобы метки начали кластеризоваться, выставляем опцию.
      clusterize: true,
      // ObjectManager принимает те же опции, что и кластеризатор.
      gridSize: 32,
      clusterDisableClickZoom: true,
    });

  // Создадим 5 пунктов выпадающего списка.
  var listBoxItems = [
      "0-50 м2",
      "50-100 м2",
      "100-400 м2",
      "400-1000 м2",
      "1000-3000 м2",
      "3000-10000 м2",
      "10000-20000 м2",
      "20000-40000 м2",
      "40000-60000 м2",
      "60000-100000 м2",
    ].map(function (title) {
      return new ymaps.control.ListBoxItem({
        data: {
          content: title,
        },
        state: {
          selected: false,
        },
      });
    }),
    reducer = function (filters, filter) {
      filters[filter.data.get("content")] = filter.isSelected();
      return filters;
    }, // Теперь создадим список, содержащий 5 пунктов.
    listBoxControl = new ymaps.control.ListBox({
      data: {
        content: "Площадь",
        title: "Площадь",
      },
      items: listBoxItems,
      state: {
        // Признак, развернут ли список.
        expanded: true,
        filters: listBoxItems.reduce(reducer, {}),
      },
    });
  myMap.controls.add(listBoxControl);
  // Добавим отслеживание изменения признака, выбран ли пункт списка.
  listBoxControl.events.add(["select", "deselect"], function (e) {
    var listBoxItem = e.get("target");
    var filters = ymaps.util.extend({}, listBoxControl.state.get("filters"));
    filters[listBoxItem.data.get("content")] = listBoxItem.isSelected();
    listBoxControl.state.set("filters", filters);
  });

  var filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add("filters", function (filters) {
    // Применим фильтр.
    objectManager.setFilter(getFilterFunction(filters));
  });

  function getFilterFunction(categories) {
    return function (obj) {
      var content = obj.properties.areaFragment;

      return categories[content];
    };
  }
  // Чтобы задать опции одиночным объектам и кластерам,
  // обратимся к дочерним коллекциям ObjectManager.
  objectManager.objects.options.set("preset", "islands#greenDotIcon");
  objectManager.clusters.options.set("preset", "islands#greenClusterIcons");
  myMap.geoObjects.add(objectManager);
  // в url вставляется адрес для запроса данных
  $.ajax({
    url: "http://localhost:3000/RECORDS",
  }).done(function (data) {
    let [features, tiles] = createFeatures(data);
    tiles.slice(0, 2).map((item) => {
      let temp = item.split("/");
      let tile = [Number(temp[0]), Number(temp[1])];
      console.log(tile);

      axios
        .get(
          "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/7/39/78.pbf",
          {
            responseType: "arraybuffer",
          }
        )
        .then(function (response) {
          console.log(response);
          // responseData is an ArrayBuffer!
          var geojson = geobuf.decode(new Pbf(response.data));
          console.log(geojson);
          dataTiles.push(data);
        });
    });

    objectManager.add(features);
  });
}
console.log({ window });
