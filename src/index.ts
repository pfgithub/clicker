import { Game } from "./clicker";
import "./index.css";
import {render} from "solid-js/web";
import { App } from "./new_ui";

let main = document.getElementById("main") || document.body;

if(location.hash === "#newui") {
    render(App, main);
}else{
    main.appendChild(Game());
}

