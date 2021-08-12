/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import webdriver from 'selenium-webdriver';

export const By = webdriver.By;
export const until = webdriver.until;

export async function authorize(driver) {
  await driver.findElement(By.className('login-redirect-authorize')).click();
  await driver.wait(until.elementLocated(By.className('login-card')), 2000);
  await driver.findElement(By.name('login')).sendKeys('test');
  await driver.findElement(By.name('password')).sendKeys('test');
  await driver.findElement(By.className('login-submit')).click();
  await driver.wait(until.elementLocated(By.className('login-card')), 2000);
  await driver.findElement(By.className('login-submit')).click();
  await driver.wait(until.elementLocated(By.id('loaded')));
}
