declare interface ExportPointResult{
    sprint: string,
    createDate: Date,
    dueDate: Date,
    milestone: string,
    title: string,
    assignees: string,
    category: string,
    points: any,
    type: string,
    flow: string
}

export default ExportPointResult
