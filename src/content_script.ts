import {ExportSrv} from "./Application/Service/ExportSrv";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.color) {
        console.log('Receive color = ' + msg.color);
        document.body.style.backgroundColor = msg.color;
        sendResponse('Change color to ' + msg.color);
    } else {
        sendResponse('Color message is none.');
    }
});

import {Action} from "./Application/Service/Action";
import {MyJobsSrv} from "./Application/Service/MyJobsSrv";
import {MREnlarge} from "./Application/Service/MREnlarge";
// import {CloseDeployedSrv} from "./Application/Service/CloseDeployedSrv";

export class BoardExport {
    static async addButton2(){
        const map : Array<Action> = [
            new ExportSrv(),
            new MyJobsSrv(),
            new MREnlarge(),
            // new CloseDeployedSrv()
        ]

        map.forEach((val: ExportSrv) => {
            val.addEvent(document);
        })
    }
}

declare global{
    interface Window {
        gon?: any;
    }
}

document.addEventListener('inject_from_content_script', function (e: any) {
    // do whatever you'd like! Like access the window obj
    window.gon = e.detail.gon;

    BoardExport.addButton2();
})

const s = document.createElement('script');
s.id = 'inject';
// s.src = chrome.extension.getURL('js/inject.js');
s.innerHTML = "console.log(['cs',gon, window.gon]); let g = JSON.stringify(gon);\n" +
    "document.dispatchEvent(new CustomEvent('inject_from_content_script', {\n" +
    "    detail: {\n" +
    "        gon: gon,\n" +
    "    }\n" +
    "}))";
document.body.appendChild(s);
