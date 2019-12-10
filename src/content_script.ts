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
import {CloseDeployedSrv} from "./Application/Service/CloseDeployedSrv";

export class BoardExport {
    static async addButton2(){
        const map : Array<Action> = [
            new ExportSrv(),
            new MyJobsSrv(),
            // new CloseDeployedSrv()
        ]

        map.forEach((val: ExportSrv) => {
            val.addEvent(document);
        })
    }
/*

    static async addButton() {

        //add export button group
        let divAddList = document!.getElementById("js-add-list") as HTMLDivElement;
        if (divAddList) {
            addMyJobs();
            addExport();
            addCloseProduction();
        }

        function addMyJobs() {
            let divExp = document.createElement("div") as HTMLDivElement;
            let buttonExp = document.createElement("button", {}) as HTMLButtonElement;
            buttonExp.innerText = "MyJobs";
            buttonExp.id = 'expMyJobs'
            buttonExp.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
            divExp.appendChild(buttonExp)
            divExp.classList.add("dropdown", "prepend-left-10")
            divAddList!.parentElement.insertBefore(divExp, divAddList);
            divExp.addEventListener("click", BoardExport.myJobsClicked)
        }

        //add close button to 已佈署正式
        function addExport() {
            let divExp = document.createElement("div") as HTMLDivElement;
            let buttonExp = document.createElement("button", {}) as HTMLButtonElement;
            buttonExp.innerText = "Export";
            buttonExp.id = 'expList'
            buttonExp.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
            divExp.appendChild(buttonExp)
            divExp.classList.add("dropdown", "prepend-left-10")
            divAddList!.parentElement.insertBefore(divExp, divAddList);
            divExp.addEventListener("click", BoardExport.exportClicked)
        }

        function addCloseProduction() {
            let divExp = document.createElement("div") as HTMLDivElement;
            let buttonToAdd = document.createElement("button", {}) as HTMLButtonElement;
            buttonToAdd.innerText = "Close";
            buttonToAdd.id = 'expList'
            buttonToAdd.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
            divExp.appendChild(buttonToAdd)
            divExp.classList.add("dropdown", "prepend-left-10")
            divAddList!.parentElement.insertBefore(divExp, divAddList);
            divExp.addEventListener("click", BoardExport.closeProductionClicked)
        }
    }


    private static async myJobsClicked(e: MouseEvent) {
        // const { userId, userName, userFullName, userAvatar } = detectGlobals();

        (e.target as HTMLButtonElement).disabled = true;
        let url = new URL(document.baseURI);
        let gitlab = new Gitlab({
            host: url.origin,
            camelize: true
        });

        const issues = await BoardExport.genMyJobsObject(gitlab);
        console.log(issues);
    }

    private static async genMyJobsObject(gitlab: Gitlab): Promise<Issue[]> {
        return new Promise<Issue[]>(async (resolve, reject) => {
            let gissues = await gitlab.Issues.all({state: 'opened', assignee_id: 1, perPage: 100}) as Issue[]
            resolve(gissues);
        })
    }


    private static async genReportObject(gitlab: Gitlab, group: Group, issue: Issue): Promise<ExportResult> {
        let regex = /(\w*)\/([\S\W -]*)/;
        let gissues = await gitlab.Issues.all({
            groupId: group.id,
            state: 'opened',
            'iids[]': issue.iid,
            perPage: 100
        }) as Issue[]

        if (gissues.length == 0) {
            return;
        }

        let gissue = gissues.find((val) => {
            return val.id === issue.id
        });

        // let obj: any;
        let obj = {
            createDate: gissue.createdAt,
            assignees: gissue.assignees.length != 0 ? gissue.assignees[0].username : "",
            dueDate: gissue.dueDate,
            milestone: gissue.milestone ? gissue.milestone.title : "",
            title: gissue.title,
            author: gissue.author.name,
            type: null,
            flow: null,
            sprint: null,
            category: null
        }

        //把 label 展開成為欄位
        let result = gissue.labels.reduce((accumulator, currentValue) => {
            let match = regex.exec(currentValue)
            if (match) {
                accumulator[match[1]] = match[2];
            }
            return accumulator;
        }, obj)

        return result;
    }

    private static async issuesInList(gitlab: Gitlab, board: Board, list: List, increasePage: boolean,
                                      callback: (issue: Issue, index: number) => any
    ) {
        let issuesInList: Issue[];
        let page = 0;
        let index = -1;
        do {
            let url = '/-/boards/' + board.id + '/lists/' + list.id + '/issues'
            let query = {id: list.id, scope: 'all', state: 'opened', page: page, perPage: 100};
            let response = await gitlab.Issues.requester.get("issues", url, {query: query})
            issuesInList = JSON.parse(response.body).issues as Issue[];
            issuesInList = camelizeKeys(issuesInList);

            if (!Array.isArray(issuesInList)) {
                break;
            }

            await Promise.all(issuesInList.map(async (issue) => {
                index++;
                return callback(issue, index)
            }));

            if (increasePage) page++;
        } while (issuesInList.length !== 0)

    }

    private static async getGroupListsInBoard(gitlab: Gitlab) {
        let group: Group;
        let groups = await gitlab.Groups.show(document.body.dataset.group);

        if (Array.isArray(groups)) {
            group = groups.find((elm: Group) => {
                return elm.name == document.body.dataset.group
            }) as Group
        } else {
            group = groups as Group
        }

        //let issues: Array<Issue> = [];
        let boards = await gitlab.GroupIssueBoards.all(group.id) as Board[];
        let board = boards[0];

        console.log(`Total lists in board(${board.id}): ${board.lists.length}`)

        return {group: group, board: board};
    }

    private static async closeProductionClicked(e: MouseEvent) {
        (e.target as HTMLButtonElement).disabled = true;
        let url = new URL(document.baseURI);

        let gitlab = new Gitlab({
            host: url.origin,
            token: "y9yA8C82nVCyAj8QoW3g",
            camelize: true
        });

        let groupBoard = await BoardExport.getGroupListsInBoard(gitlab);

        let listToClose = groupBoard.board.lists.find((l) => {
            return l.label.name == "flow/已部署正式"
        });

        if (listToClose) {
            BoardExport.issuesInList(gitlab, groupBoard.board, listToClose, false, (issue, index) => {
                console.log(`Issue to close, issue id: ${issue.iid}`)
                gitlab.Issues.edit(issue.projectId, issue.iid, {state_event: 'close'})
            })
        }
        ;

        (e.target as HTMLButtonElement).disabled = false;
    }


    private static async exportClicked(e: MouseEvent) {
        (e.target as HTMLButtonElement).disabled = true;

        let url = new URL(document.baseURI);
        let gitlab = new Gitlab({
            host: url.origin,
            camelize: true
        });

        let groupBoard = await BoardExport.getGroupListsInBoard(gitlab);
        let board = groupBoard.board
        let group = groupBoard.group

        let report: Array<any> = new Array<any>();

        let sortedList = board.lists.sort((a, b) => {
            return a.position > b.position ? 1 : -1
        })

        await Promise.all(sortedList.map(async (list, index) => {
            console.log(`Starting to collect issues in ${list.label}`)
            let page = 1;

            if (!list.label.name.includes('/')) {
                return;
            }

            //get issues in list
            let issuesInList: Issue[];
            do {
                let url = '/-/boards/' + board.id + '/lists/' + list.id + '/issues'
                let query = {id: list.id, scope: 'all', state: 'opened', page: page};
                let response = await gitlab.Issues.requester.get("issues", url, {query: query})

                issuesInList = JSON.parse(response.body).issues as Issue[];

                if (!Array.isArray(issuesInList) || issuesInList.length === 0) {
                    break;
                }

                let a = await Promise.all(issuesInList.map(async (issues) => {
                    let j = await BoardExport.genReportObject(gitlab, group, issues);
                    return j;
                }));

                console.log(`Report Obj got(${list.label.name}),  page : ${page}], isuess, ${a.length}`)

                if (a.length !== 0) {
                    report = report.concat(a);
                }

                page++;
            } while (issuesInList.length !== 0)

            return report;
        }));

        (e.target as HTMLButtonElement).disabled = false;


        function downloadCsv(obj) {
            let csv = Papa.unparse(obj);
            let a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            a.target = '_blank';
            a.download = moment().format('YYYYMMDD') + '.csv';
            document.body.appendChild(a);
            a.click();
        }

        downloadCsv(report)

        console.log(report);
    }

 */
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
