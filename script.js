import * as THREE from './vendor/three.js-master/build/three.module.js';
import Stats from './vendor/three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './vendor/three.js-master/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from './vendor/three.js-master/examples/jsm/loaders/FBXLoader.js';

const Scene = {

    //arrow function : '() =>' est egal a 'function()'

    vars: {
        container: null,
        scene: null,
        renderer: null,
        camera: null,
        ambient : null,
        controls : null,
        cloudGeo : null,
        texture: null,
        flash: null,
        cloud : null,
        cloudMaterial : null,
        cloudParticles : null,
        rainGeo : null,
        rainDrop : null,
        rainMaterial : null,
        rain : null,
        heure : null,
        suncolor : null,
        cloudcolor : null,
        skycolor : null,
        raincolor : null,
        thundercolor : null,
        sun: null,
        sunlight : null,
        latitude :0 ,
        longitude : 0,
        meteoville: ''
    },

    animate: () => {

        //animation éclairs
        if(Math.random() > 0.99 || Scene.vars.flash.power > 100) {
            if (Scene.vars.flash.power < 100)
                Scene.vars.flash.position.set(
                    Math.random() * 400,
                    300 + Math.random() * 200,
                    100);
            Scene.vars.flash.power = 50 + Math.random() * 500;
        }

        //animation pluie
        Scene.vars.rainGeo.vertices.forEach(p => {
            p.velocity -= 0.1 ;
            p.y += p.velocity;
            if (p.y < 0) {
                p.y =1000;
                p.velocity = 0;
            }
        });
        Scene.vars.rainGeo.verticesNeedUpdate = true;

        //récupération heure
        Scene.vars.heure = Scene.heure();
        document.getElementById('heure').innerHTML = Scene.vars.heure;

        Scene.render();
        requestAnimationFrame(Scene.animate);
    },

    //récupère les coordonnées d'une position
    coord : (position) => {
        sessionStorage.setItem('lat', position.coords.latitude);
        sessionStorage.setItem('lng', position.coords.longitude);
    },

    //coordonnées par défaut Paris
    defaultCoord : () => {
        Scene.vars.latitude = 48.866667;
        Scene.vars.longitude = 2.333333;
    },

    // Exécute un appel AJAX GET
    // Prend en paramètres l'URL cible et la fonction callback appelée en cas de succès
    ajaxGet : (url, callback) => {
        let req = new XMLHttpRequest();
        req.open("GET", url);
        req.addEventListener("load", function () {
            if (req.status >= 200 && req.status < 400) {
                // Appelle la fonction callback en lui passant la réponse de la requête
                callback(req.responseText);
            } else {
                console.error(req.status + " " + req.statusText + " " + url);
            }
        });
        req.addEventListener("error", function () {
            console.error("Erreur réseau avec l'URL " + url);
        });
        req.send(null);
    },

    //fonction de récupération de la météo avec API OpenWeather
    meteo: () => {

        if ( navigator.geolocation ) {
            //Récupération geolocalisation
            navigator.geolocation.getCurrentPosition(Scene.coord);
            Scene.vars.latitude = sessionStorage.getItem('lat');
            Scene.vars.longitude = sessionStorage.getItem('lng');
        } else {
            // Function alternative sinon
            Scene.defaultCoord();
        }

        //récupération des données sous format Json
        Scene.ajaxGet("https://api.openweathermap.org/data/2.5/weather?lat="+Scene.vars.latitude+"&lon="+Scene.vars.longitude+"&APPID=7d4d826c70f82675ed4e15a43deb4eaf", function (reponse) {
            var meteo = JSON.parse(reponse);
            meteo = meteo.weather[0].main;
            sessionStorage.setItem('meteo', meteo);
        });
        //récupération de la météo
        Scene.vars.meteoville = sessionStorage.getItem('meteo');


    },

    render: () => {
        Scene.vars.renderer.render(Scene.vars.scene, Scene.vars.camera);

        //animation nuages
        Scene.vars.cloudParticles.forEach(p => {
            p.rotation.z -= 0.005;
        });
    },

    //redimension fenetre
    onWindowResize: () => {
        let vars = Scene.vars;
        vars.camera.aspect = window.innerWidth / window.innerHeight;
        vars.camera.updateProjectionMatrix();
        vars.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    //récupération de l'heure locale
    heure : () => {
    var date = new Date();
    var heure = date.getHours();
    var minutes = date.getMinutes();
        if(minutes < 10)
            minutes = "0" + minutes;
        return heure + "h" + minutes;
    },

    //INIT
    init: () => {
        let vars = Scene.vars;

        //activation meteo et récupération de l'heure
        Scene.meteo();
        var date = new Date();
        var heure = date.getHours();

        console.log(vars.meteoville);
        //couleurs des elements selon meteo et heure
        if (heure < 7 || heure > 19){
            vars.skycolor = 0x00071b;
        }else {
            vars.skycolor = 0xb1e1f8;
        }
        switch (vars.meteoville) {
            case 'Clouds' :
                vars.cloudcolor = 0xffffff;
                break;

            case 'Clear' :
                if (heure < 7 || heure > 19){
                    vars.suncolor = 0xc3c3c3;
                }else {
                    vars.suncolor = 0xfffcb9;
                }
                break;
            case 'Rain' :
                vars.cloudcolor = 0x454545;
                vars.raincolor = 0xaeaeae;
                break;
            case 'Drizzle' :
                vars.cloudcolor = 0xb2b2b2;
                vars.raincolor = 0xaeaeae;
                break;
            case 'Mist' :
                vars.cloudcolor = 0xb2b2b2;
                break;
            case 'Snow' :
                vars.cloudcolor = 0xb2b2b2;
                vars.raincolor = 0x000000;
                break;
            case 'Thunderstorm':
                vars.cloudcolor = 0xb2b2b2;
                vars.raincolor = 0xaeaeae;
                vars.thundercolor = 0x000000;
                if (heure > 7 || heure < 19){
                    vars.skycolor = 0x686868;
                }
                break;

        };

        //Preparation du container
        vars.container = document.createElement('div');
        vars.container.classList.add('fullscreen');
        document.body.appendChild(vars.container);

        //création de la scène
        vars.scene = new THREE.Scene();

        //parametrage du moteur de rendu
        vars.renderer = new THREE.WebGLRenderer({antialias: true});
        vars.renderer.setPixelRatio(window.devicePixelRatio);
        vars.renderer.setSize(window.innerWidth, window.innerHeight);
        vars.container.appendChild(vars.renderer.domElement);

        //création caméra
        vars.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        vars.camera.position.set(0,500,450);
        vars.camera.lookAt(new THREE.Vector3(0,500,0));
        vars.scene.add(vars.camera);

        //création ambiance / couleur nuage
        vars.ambient = new THREE.AmbientLight(vars.cloudcolor);
        console.log(vars.cloudcolor);
        vars.scene.add(vars.ambient);

        //brouillard / couleur fond
        vars.scene.fog = new THREE.FogExp2(vars.skycolor, 0.001);
        vars.renderer.setClearColor(vars.scene.fog.color);

        //soleil
        var geometry = new THREE.SphereGeometry( 50, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: vars.suncolor} );
        vars.sun = new THREE.Mesh( geometry, material );
        vars.sun .position.y = 525;
        vars.sun .position.x = 8;
        if (vars.meteoville != 'Thunderstorm'){
            vars.scene.add(vars.sun);
        }

        //lumière soleil
        vars.sunlight = new THREE.HemisphereLight( 0xffffff, 0.5 );
        vars.sunlight.position.y = 525;
        vars.sunlight.position.x = 8;
        if (vars.meteoville != 'Thunderstorm'){
            vars.scene.add(vars.sun);
            vars.scene.add(vars.sunlight);
        }



        //Nuages
        vars.texture = new THREE.TextureLoader().load('texture/smoke.png');
        vars.cloudGeo = new THREE.PlaneBufferGeometry(500,500);
        vars.cloudMaterial = new THREE.MeshLambertMaterial({
            map: vars.texture,
            transparent: true
        });

        //animation nuages
        vars.cloudParticles = [];
        for(let p=0; p<50; p++) {
            vars.cloud = new THREE.Mesh(vars.cloudGeo, vars.cloudMaterial);
            vars.cloud.position.set(
                Math.random() * 800 - 400,
                500,
                Math.random() * 500 - 500
            );
            vars.cloud.rotation.x = 0;
            vars.cloud.rotation.y = 0;
            vars.cloud.rotation.z = Math.random() * 2 * Math.PI;
            vars.cloud.material.opacity = 0.55;
            vars.cloudParticles.push(vars.cloud);
            if (vars.meteoville != 'Clear'){
                vars.scene.add(vars.cloud);
            }

        }


        //initialisation eclairs
        vars.flash = new THREE.PointLight(vars.thundercolor, 30, 500 ,1.7);
        vars.flash.position.set(200,300,100);
        if (vars.meteoville == 'Thunderstorm'){
            vars.scene.add(vars.flash);
        }

        //pluie
        var rainSize;
        if (vars.meteoville == 'Drizzle'){
            rainSize = 0.5;
        } else {
            rainSize = 1.5;
        }
        vars.rainGeo = new THREE.Geometry();
        for(let i=0;i<1500;i++) {
            vars.rainDrop = new THREE.Vector3(
                Math.random() * 800 -400,
                Math.random() * 1000,
                Math.random() * 400 - 200
            );
            // vars.rainDrop.velocity = {};
            vars.rainDrop.velocity = 0;
            vars.rainGeo.vertices.push(vars.rainDrop);
        }
        vars.rainMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: rainSize,
            transparent: true
        });
        vars.rain = new THREE.Points(vars.rainGeo,vars.rainMaterial);
        if (vars.meteoville != 'Clear' || vars.meteoville!= 'Clouds'){
            vars.scene.add(vars.rain);
        }
        


            //axehelper
        // var axesHelper = new THREE.AxesHelper(5);
        // vars.scene.add(axesHelper);
        // vars.controls = new OrbitControls(vars.camera, vars.renderer.domElement);
        // vars.controls.minDistance = 500;
        // vars.controls.maxDistance = 1200;
        // vars.controls.minPolarAngle = Math.PI / 4;
        // vars.controls.maxPolarAngle = Math.PI / 2;
        // vars.controls.minAzimuthAngle = -Math.PI / 4;
        // vars.controls.maxAzimuthAngle = Math.PI /4;
        // vars.controls.target.set(0,500,0);
        // vars.controls.update();
        // let grid = new THREE.GridHelper(2000, 50, 0xFF3400, 0xFF3400);
        // grid.material.opacity = 0.2;
        // grid.material.transparent = true;
        // vars.scene.add(grid);



        //resizer
        Scene.render();
        window.addEventListener('resize', Scene.onWindowResize, false);
        Scene.animate();

    }

};
$("#loading").remove();
Scene.init();
