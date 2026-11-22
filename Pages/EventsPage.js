export class Events
{
    constructor(page,event)
    {
        this.page = page;
        this.search = page.getByPlaceholder('Search events, venues…');
        this.category = page.locator('select').filter(
            {has: page.locator('option', {hasText:'All Categories'})}
        );
        this.Location_category = page.locator('select').filter(
            {has: page.locator('option', {hasText:'All Cities'})}
        );
        this.eventname = page.getByRole("heading",{name:event});
    }

async ValidSearch(eventname)
{
    await this.search.pressSequentially(eventname,{delay:500});
}

}