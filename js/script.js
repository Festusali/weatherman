'use strict';

// Create necessary variables
let subscribed = false;
let promptInstall = null;
let city = false;

// Create necessary constants
const apiKey = "SECRET_API_KEY";
const installButton = document.getElementById('installButton');
const searchForm = document.getElementById('searchForm');


// Gets search value from form
function getSearchCity() {
    city = document.getElementById('searchCity').value;
    return city
}

// Listen to submit event on search form
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    getSearchCity();
    if (city) {
        console.log('calling: ', "getWeatherForecast(city)");
        getWeatherForecast(city);
    } else {
        console.log('Enter valid city name.')
    }
})

// Function for working with dates
class MyDate {
    constructor(time) {
        this.time = new Date(time * 1000);
    }

    WEEKS = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    MONTHS = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ];

    get getDay() {
        return this.WEEKS[this.time.getDay()];
    }

    get getMonth() {
        return this.MONTHS[this.time.getMonth()];
    }

    get getDate() {
        return this.time.getDate();
    }

    get getFullYear() {
        return this.time.getFullYear();
    }

    get toLocaleTimeString() {
        return this.time.toLocaleTimeString();
    }
}

// Function to update Current Weather
function updateCurrentWeather(current) {
    console.log('calling: ', "updateCurrentWeather(current)");
    current = current.list[0];
    const myDate = new MyDate(current.dt);
    const cityTitle = document.querySelector(".city-title");
    const cityCountry = document.querySelector(".city-country");
    const description = document.querySelector(".description");
    const windDescription = document.querySelector(".wind-description");
    const temperature = document.querySelector(".temperature");
    const dateText = document.querySelector(".dmy #time");
    const date = document.querySelector(".dmy .date");

    cityTitle.textContent = current.name;
    cityCountry.textContent = current.sys.country;
    description.textContent = current.weather[0].description.toUpperCase();
    windDescription.textContent = `${current.wind.speed} -- ${current.wind.deg}`;
    temperature.innerHTML = `<p>${parseInt(current.main.temp)}°<span>C</span></p>`;
    dateText.textContent = myDate.toLocaleTimeString;
    date.textContent = `${myDate.getDay}, ${myDate.getMonth}, ${myDate.getDate}, ${myDate.getFullYear}`;
}

// Function to update forecast weather
function updateForecastWeather(forecast) {
    console.log('Inside: ', "updateForecastWeather(forecast)");
    let tableBody = document.getElementById("forecast").querySelector("tbody");
    let rows = [];
    forecast.forEach((day) => {
        let myDate = new MyDate(day.dt)
        rows.push(`
            <tr><td>${myDate.getDay}</td> <td>${day.weather[0].description}</td> <td>${parseInt(day.feels_like.day)}</td> <td>${day.wind_speed}</td> <td>${day.wind_deg}</td></tr>
        `)
    });
    tableBody.innerHTML = rows;
}

// Uses Promise to get data from URL
function getData(url) {
    return fetch(url).then((response) => {
        return response.json();
    }).catch((error) => {
        console.log('Error fetching data.', error);
        return null;
    })
}

//
function getCachedForecast(city) {
    console.log('Inside cached weather function');
    return JSON.parse(localStorage.getItem(city));
}


// Get updated forecast from data source API.
function getWeatherForecast(cityName) {
    console.log('Inside: ', "getWeatherForecast(city)");
    
    // Current Weather API
    const curApiUrl = `https://api.openweathermap.org/data/2.5/find?q=${cityName}&units=metric&appid=${apiKey}`;
    console.log('Past var declaration');
    
    let dailyw = null;
    let currentw = null;
    getData(curApiUrl)
        .then((current) => {
            if (current && current.list !== 0) {
                currentw = current;
                console.log('Inside forecast if. List: ', current.list, current.list[0].coord.lat);
                const lat = current.list[0].coord.lat;
                const lon = current.list[0].coord.lon;
                // Forecast Weather API
                const fcApiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,hourly,minutely&appid=${apiKey}`;
                dailyw = getData(fcApiUrl);
                return dailyw;
            }
        })
        .then((daily) => {
            if (currentw && daily) {
                console.log('Current: ', currentw, 'Daily: ', daily);
                localStorage.setItem(cityName, JSON.stringify([currentw, daily]));
                updateCurrentWeather(currentw);
                updateForecastWeather(daily.daily);
            }
        })
        .catch((error) => {
            console.error('Unable to get weather data: ', error);
            let cached = getCachedForecast(cityName);
            if (cached) {
                console.log('Retrieving from localStorage...: Cache: ', cached);
                // currentw = cached[0];
                // dailyw = cached[1];
                updateCurrentWeather(cached[0]);
                updateForecastWeather(cached[1].daily);
            } else {
                return null; // window.location = '/offline.html';
            }
        })
    return;
}

// Function to update push notification button
function updatePushButton() {
    if (Notification.permission === 'denied') {
        pushButton.textContent = 'Push Notification Blocked';
        pushButton.disabled = true;
        return;
    } else if (reason === 'granted') {
        pushButton.textContent = 'Disable Notifications';
        subscribed = true;
    } else if (reason === 'default') {
        pushButton.textContent = 'Enable Notifications';
    }
    pushButton.disabled = false;
}

// Save event for later prompt
function deferInstallPrompt(event) {
    // Save the event for later prompt
    promptInstall = event;
    installButton.removeAttribute('hidden');
}

// Listen for click event on our install button
// and off kick installation.
installButton.addEventListener('click', (event) => {
    // Prompt the user to install and then hide the button.
    // Only show the button again after user dismisses prompt.
    promptInstall.prompt();
    event.target.setAttribute('hidden', true);

    // Log user choice to console
    promptInstall.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
            console.log('User accepted app installation: ', choice);
        } else {
            console.log('User dismissed app installation: ', choice);
        }
        // Clear the prompt
        promptInstall = null;
    });
})

// Listen for global window installation prompt.
// Then invoke deferInstallPrompt that will respond accordingly.
window.addEventListener('beforeinstallprompt', deferInstallPrompt);

// Since users can attempt app installation from other sources,
// Listen to window app installation event and log appropriately.
window.addEventListener('appinstalled', (event) => {
    console.log('Weatherman App successfully installed. ', event);
})
