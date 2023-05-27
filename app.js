import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
import { chat, classifyTask, doTask } from "./chatbot.js"
import { Configuration, OpenAIApi } from "openai";
import * as readline from 'readline';



const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
var user_message = String.raw`I have to go to the docker to have my back bone checked tomorrow at 8am at Careplus. Need to prepare from 7am`

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
async function main() {
  while (true) {

    const answer = await new Promise((resolve) => {
      rl.question('[You](enter \"cancel\" to exit): ', resolve);
    });
    if (answer === 'cancel') {
      rl.close();
      return;
    } else {
      const task = await classifyTask(answer);
      if (task == null) {
        const response = await chat(answer);
        console.log(response);
      }
      else{
        const task_result = await doTask(answer, task);
        console.log(task_result);
      }
    }
  }
};

main()

