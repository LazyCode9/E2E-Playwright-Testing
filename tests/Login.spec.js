import { test, expect } from '@playwright/test';
import { Login } from '../Pages/LoginPage.js';
import { Home } from '../Pages/HomePage.js';

const url = "https://eventhub.rahulshettyacademy.com/";
const email = "enma@gmail.com";
const password = "Zorojur0!";

test.describe('Login Tests', () => {

    test.use({ storageState: { cookies: [], origins: [] } });
    
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
    

});