declare interface ExportResult{
    createDate: Date,
    assignees: string,
    dueDate: Date,
    milestone: string,
    title: string,
    author: string,
    type: string,
    flow: string,
    sprint: string,
    category: string
}

export default ExportResult
