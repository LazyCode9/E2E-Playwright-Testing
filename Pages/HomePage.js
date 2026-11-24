export class Home
{
    constructor(page)
    {
        this.page = page;
        this.expected_heading_home = page.getByRole("heading", {name:'Featured Events'});
        this.logout_button = page.getByRole("button",{name:'Logout'});
        this.expected_heading_login = page.getByRole("heading", {name: 'Sign in to EventHub'});
        this.Events = page.getByRole("link",{name:'Events',exact: true});
        
    }

async Go(url)
{
    await this.page.goto(url);
}

async ValidateLogout()
{
    await this.logout_button.click();
}

async GoEvents()
{
    await this.Events.click();
}


}