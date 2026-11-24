import { test, expect } from '@playwright/test';
import { Login } from '../Pages/LoginPage.js';
import { Home } from '../Pages/HomePage.js';
import { Events } from '../Pages/EventsPage.js';

const url = "https://eventhub.rahulshettyacademy.com/";
const email = "enma@gmail.com";
const password = "Zorojur0!";

 test("Login_Test", async ({page})=>{
    
        const login = new Login(page);
        const home = new Home(page);
        await login.Go(url);
        await login.validLogin(email,password);
        await expect(home.expected_heading_home).toBeVisible();
        await page.context().storageState({path:'Pages/Auth.json'});
    })

test("Invalid_Login", async ({page}) => {
    const login = new Login(page);
    let fake_email = "fake@gmail.com";
    let fake_password = "pass123";
    await login.Go(url);
    await login.validLogin(fake_email,fake_password);
    await expect(login.loginError).toBeVisible();
    });

test("Logout_Test", async ({page}) => {
    const home = new Home(page);
    const login = new Login(page);
    await login.Go(url);
    await login.validLogin(email,password);
    await home.ValidateLogout();
    await expect(home.expected_heading_login).toBeVisible();
})


test("Search_Test", async ({page}) => {
    const home = new Home(page);
    const events = new Events(page);
    const login = new Login(page);
    await login.Go(url);
    await login.validLogin(email,password);
    await home.GoEvents();
    await events.ValidSearch("Dilli Diwali Mela");
    await expect(events.eventname).toBeVisible();
})

test('Filter_test', async ({ page }) => {
    const home = new Home(page);
    const events = new Events(page);
    const login = new Login(page);
    const category= "Conference";
    await login.Go(url);
    await login.validLogin(email,password);
    await home.GoEvents();
    await events.Filter_Category(category);
    await expect(page.getByTestId('event-card')).toContainText('Conference');
});