export class Login
{
    constructor(page)
    {
        this.page = page;
        this.email = page.getByLabel("Email");
        this.password = page.getByLabel("Password");
        this.signin = page.getByRole("button",{name:"Sign In"})
        this.loginError = page.getByText('Invalid email or password');

    }

    async Go(url)
    {
        await this.page.goto(url);
    }

    async validLogin(email,password)
    {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.signin.click();
    }
}