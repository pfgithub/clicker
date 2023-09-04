import { GameUI } from "./clicker";
import "./index.css";
import {render} from "solid-js/web";
import { App } from "./new_ui";
import { newCore } from "./core";

let main = document.getElementById("main") || document.body;

const core = newCore();

if(location.hash === "#oldui") {
    main.appendChild(GameUI(core));
}else{
    render(() => App(core), main);
}

