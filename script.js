// Weather finder - uses Open-Meteo (free API, no key needed)

var form = document.getElementById("searchForm");
var cityInput = document.getElementById("cityInput");
var message = document.getElementById("message");
var result = document.getElementById("result");

// weather code -> text and emoji (codes are from Open-Meteo docs)
function getWeather(code) {
  if (code === 0) return { text: "Clear sky", icon: "☀️" };
  if (code === 1) return { text: "Mostly clear", icon: "🌤️" };
  if (code === 2) return { text: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { text: "Cloudy", icon: "☁️" };
  if (code === 45 || code === 48) return { text: "Fog", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { text: "Light drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { text: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { text: "Snow", icon: "❄️" };
  if (code >= 80 && code <= 82) return { text: "Rain showers", icon: "🌧️" };
  if (code === 85 || code === 86) return { text: "Snow showers", icon: "🌨️" };
  if (code >= 95) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Unknown", icon: "🌡️" };
}

function showMessage(text, isInfo) {
  message.textContent = text;
  message.className = isInfo ? "info" : "";
}

async function searchCity(city) {
  showMessage("Searching...", true);
  result.classList.add("hidden");

  try {
    // step 1: city name -> latitude and longitude
    var geoUrl = "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city);
    var geoRes = await fetch(geoUrl);
    var geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showMessage("City not found. Check the spelling and try again.");
      return;
    }
    var place = geoData.results[0];

    // step 2: get the weather of that place
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=6";
    var res = await fetch(url);
    var data = await res.json();

    showWeather(place, data);
    showMessage("");
  } catch (error) {
    showMessage("Could not get the weather. Check your internet and try again.");
  }
}

function showWeather(place, data) {
  var now = data.current;
  var w = getWeather(now.weather_code);

  document.getElementById("cityName").textContent = place.name + (place.country ? ", " + place.country : "");
  document.getElementById("icon").textContent = w.icon;
  document.getElementById("temp").textContent = Math.round(now.temperature_2m) + "°C";
  document.getElementById("desc").textContent = w.text;
  document.getElementById("feels").textContent = Math.round(now.apparent_temperature) + "°C";
  document.getElementById("humidity").textContent = now.relative_humidity_2m + "%";
  document.getElementById("wind").textContent = now.wind_speed_10m + " km/h";

  // next 5 days (index 0 is today so we start from 1)
  var daysBox = document.getElementById("days");
  daysBox.innerHTML = "";
  for (var i = 1; i < data.daily.time.length; i++) {
    var dw = getWeather(data.daily.weather_code[i]);
    var date = new Date(data.daily.time[i] + "T00:00");
    var dayName = date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

    var box = document.createElement("div");
    box.className = "day";
    box.innerHTML =
      '<div class="d-name">' + dayName + "</div>" +
      '<div class="d-icon">' + dw.icon + "</div>" +
      '<div class="d-text">' + dw.text + "</div>" +
      '<div class="d-temp">' + Math.round(data.daily.temperature_2m_max[i]) + "° / " +
      Math.round(data.daily.temperature_2m_min[i]) + "°</div>";
    daysBox.appendChild(box);
  }

  result.classList.remove("hidden");
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  var city = cityInput.value.trim();
  if (city !== "") searchCity(city);
});

// show one city when page opens
searchCity("Karachi");
