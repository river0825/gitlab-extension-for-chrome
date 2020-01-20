import {Action} from "./Action";
import Issue from "../../model/issue";
import {Gitlab} from "gitlab";
import moment = require("moment");
import Group from "../../model/group";
import Board from "../../model/board";
import {ExportToCsv} from 'export-to-csv';
import {MaterialAlert} from "../../lib/component/material-modal";
import ExportPointResult from "../../model/exportPointResult";

export class ExportPointSrv implements Action {

    // Add btn and style
    addEvent(document: Document) {
        let divAddList = document!.getElementById("js-add-list") as HTMLDivElement;
        if (!divAddList) return;

        let divExp = document.createElement("div") as HTMLDivElement;
        let buttonExp = document.createElement("button", {}) as HTMLButtonElement;
        buttonExp.innerText = "Points";
        buttonExp.id = 'exportPoints';
        buttonExp.classList.add("btn", "btn-success", "btn-inverted", "js-new-board-list")
        divExp.appendChild(buttonExp);
        divExp.classList.add("dropdown", "prepend-left-10");
        divAddList!.parentElement.insertBefore(divExp, divAddList);
        divExp.addEventListener("click", ExportPointSrv.exportPoints)
    }

    protected static async exportPoints(e: MouseEvent) {

        (e.target as HTMLButtonElement).disabled = true;

        let url = new URL(document.baseURI);
        let gitlab = new Gitlab({
            host: url.origin,
            camelize: true
        });

        let groupBoard = await ExportPointSrv.getGroupListsInBoard(gitlab);
        let board = groupBoard.board;
        let group = groupBoard.group;

        let report: Array<any> = [];

        let sortedList = board.lists.sort((a, b) => {
            return a.position > b.position ? 1 : -1
        });

        await Promise.all(sortedList.map(async (list) => {
            let page = 1;

            if (!list.label.name.includes('/')) {
                return;
            }

            let issuesInList: Issue[];
            do {
                MaterialAlert.materialAlert("卡卡貼心小提醒", "在抓資料了不要急", () => {
                });

                let url = '/-/boards/' + board.id + '/lists/' + list.id + '/issues';
                let query = {id: list.id, scope: 'all', state: 'opened', page: page};
                let response = await gitlab.Issues.requester.get("issues", url, {query: query});

                issuesInList = JSON.parse(response.body).issues as Issue[];

                if (!Array.isArray(issuesInList) || issuesInList.length === 0) {
                    break;
                }

                let a = await Promise.all(issuesInList.map(async (issues) => {
                    return await ExportPointSrv.genReportObject(gitlab, group, issues);
                }));

                console.log(`${list.label.name} ==> page : ${page}, issues : ${a.length}`);

                if (a.length !== 0) {
                    report = report.concat(a);
                }

                page++;
            } while (issuesInList.length !== 0);

            return report;
        }));

        (e.target as HTMLButtonElement).disabled = false;

        // Export file
        const options = {
            filename: moment().format('YYYY_MM_DD'),
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true,
            showTitle: true,
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
        };

        const csvExporter = new ExportToCsv(options);
        csvExporter.generateCsv(report);
        MaterialAlert.closeMaterialAlert(e);
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

        let boards = await gitlab.GroupIssueBoards.all(group.id) as Board[];
        let board = boards[0];

        return {group: group, board: board};
    }

    protected static async genReportObject(gitlab: Gitlab, group: Group, issue: Issue): Promise<ExportPointResult> {

        let regex = /(\w*)\/([\S\W -]*)/;
        let gissues = await gitlab.Issues.all({
            groupId: group.id,
            state: 'opened',
            'iids[]': issue.iid,
            perPage: 100
        }) as Issue[];

        if (gissues.length == 0) {
            return;
        }

        let gissue = gissues.find((val) => {
            return val.id === issue.id
        });

        let title = gissue.title;
        let points = parseInt(title.substring(title.indexOf("[") + 1, title.indexOf("]")));

        let obj: ExportPointResult = {
            sprint: '-',
            createDate: gissue.createdAt,
            dueDate: gissue.dueDate,
            milestone: gissue.milestone ? gissue.milestone.title : "",
            title: title,
            assignees: gissue.assignees.length != 0 ? gissue.assignees[0].username : "",
            category: '-',
            points: isNaN(points) ? '-' : points,
            type: '-',
            flow: '-'
        };

        return gissue.labels.reduce((accumulator, currentValue) => {
            let match = regex.exec(currentValue);
            if (match) {
                accumulator[match[1]] = match[2];
            }
            return accumulator;
        }, obj)
    }
}