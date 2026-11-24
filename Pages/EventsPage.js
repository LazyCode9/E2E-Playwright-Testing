export class Events
{
    constructor(page)
    {
        this.page = page;
        this.search = page.getByPlaceholder('Search events, venues…');
        this.Category= page.getByRole('combobox');
        this.eventname = page.getByRole("heading",{name:"Dilli Diwali Mela",exact:true});
    }

async ValidSearch(eventname)
{
    await this.search.pressSequentially(eventname,{delay:500});
}

async Filter_Category(category)
{
    await this.Category.first().selectOption(category);
}
}