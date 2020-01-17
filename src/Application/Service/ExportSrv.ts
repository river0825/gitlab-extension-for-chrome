import {Action} from "./Action";
import {Gitlab} from "gitlab";
import Issue from "../../model/issue";
import Group from "../../model/group";
import Board from "../../model/board";
import ExportResult from "../../model/exportResult";
import moment = require("moment");
import Papa = require('papaparse');

export class ExportSrv implements Action {
    addEvent(document: Document) {
        let divAddList = document!.getElementById("js-add-list") as HTMLDivElement;
        if(!divAddList) return;

        let divExp = document.createElement("div") as HTMLDivElement;
        let buttonExp = document.createElement("button", {}) as HTMLButtonElement;
        buttonExp.innerText = "Export";
        buttonExp.id = 'expList'
        buttonExp.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
        divExp.appendChild(buttonExp)
        divExp.classList.add("dropdown", "prepend-left-10")
        divAddList!.parentElement.insertBefore(divExp, divAddList);
        divExp.addEventListener("click", ExportSrv.exportClicked)
    }

    protected static async getGroupListsInBoard(gitlab: Gitlab) {
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


    protected static async genReportObject(gitlab: Gitlab, group: Group, issue: Issue): Promise<ExportResult> {
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
        let obj: ExportResult = {
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
        return gissue.labels.reduce((accumulator, currentValue) => {
            let match = regex.exec(currentValue)
            if (match) {
                accumulator[match[1]] = match[2];
            }
            return accumulator;
        }, obj)

    }


    protected static async exportClicked(e: MouseEvent) {
        (e.target as HTMLButtonElement).disabled = true;

        let url = new URL(document.baseURI);
        let gitlab = new Gitlab({
            host: url.origin,
            camelize: true
        });

        let groupBoard = await ExportSrv.getGroupListsInBoard(gitlab);
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

                let boardJobs = await Promise.all<ExportResult>(
                    issuesInList.map<ExportResult>(
                        // @ts-ignore
                        async (issues: Issue, index: number, arrIssue: Issue[] ): Promise<ExportResult> => {
                            return await ExportSrv.genReportObject(gitlab, group, issues);
                }));

                console.log(`Report Obj got(${list.label.name}),  page : ${page}], isuess, ${boardJobs.length}`)

                if (boardJobs.length !== 0) {
                    report = report.concat(boardJobs);
                }

                page++;
            } while (issuesInList.length !== 0)

            return report;
        }));

        (e.target as HTMLButtonElement).disabled = false;


        function downloadCsv(obj: Array<ExportResult>) {
            // let csv = Papa.unparse(obj);
            let csv = transformToCSV(obj);
            console.log(csv);
            let a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
            a.target = '_blank';
            a.download = moment().format('YYYYMMDD') + '.csv';
            document.body.appendChild(a);
            a.click();
        }

        function transformToCSV(report: Array<ExportResult>): string{
            let fields = ['createDate','assignees','dueDate','milestone','title','author','type','flow','sprint','category'];
            let csvResult = fields.join(",") + "\n";

            let lines = report.map<String>((issue: ExportResult, index: number, arr: ExportResult[]): String => {
                let val = [];
                fields.forEach((fieldName:string, index:number, arrField: string[]) :  void => {
                    val.push(issue[fieldName])
                });
                return val.join(",")
            });

            return csvResult + lines.join("\n");
        }

        downloadCsv(report)

    }
}