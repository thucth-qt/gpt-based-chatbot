import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

let instructionClassifier = fs.readFileSync('./instructions/tasks.txt', { encoding: 'utf-8' }).trim();

const task2instruction = {};
for (const file of glob.sync('./instructions/task_*.txt')) {
    const task = file.split('_').pop().split('.')[0];
    task2instruction[task] = fs.readFileSync(file, { encoding: 'utf-8' }).trim();
}

function postprocess(text_output) {
    let text_output_ = text_output.trim();
    if (text_output_.slice(-1) == ".") text_output_ = text_output_.slice(0, -1);
    text_output_ = text_output_.replace(/\n/g, '\\n');
    return text_output_
}

export async function classifyTask(userMessage) {
    var output = "error";
    var response;
    // preprocessing
    const userMessage_ = userMessage.trim();
    try {
        response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: instructionClassifier + ".\nMe: " + userMessage_ + '.\nAssistant: ',
            max_tokens: 1000,
            temperature: 0,
        });
        output = response.data.choices[0].text;
    }
    catch (error) {
        console.warn(response)
        console.warn(error)
        output = "error"
    }
    // postprocessing
    let task = postprocess(output);
    task = task.toLowerCase();
    if (Object.keys(task2instruction).includes(task)) {
        console.log(`[Bot] It seems the task is: '${task}'.`);
    } else {
        // console.log(`[Bot] It seems the task is: '${task}'. This is not a valid task`);
        // console.log(`[Bot] Please require me a task in [${Object.keys(task2instruction)}]`)
        console.log(`[Bot] It seems a normal chat.`);
        return null;
    }
    return task

}

export async function doTask(userMessage, task =null, context =null) {
    var output = "error";
    var response;
    var task_result;
    try {
        // preprocessing
        var userMessage_ = userMessage.trim();
        if (task === 'calendar') {
            const now = new Date();
            const formatDate = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: 'numeric',
                second: 'numeric',
                hour12: true,
                weekday: 'long'
            })
                .format(now);
            userMessage_ = `Now is ${formatDate}. ${userMessage}`;
        }

        // processing
        response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: task2instruction[task] + ".\nMe: " + userMessage_ + '.\nAssistant: ',
            max_tokens: 1000,
            temperature: 0,
        });

        output = response.data.choices[0].text;
        // postprocessing
        let output_postprocessed = postprocess(output);
        task_result = JSON.parse(output_postprocessed);
    }
    catch (error) {
        console.warn(response.data.choices[0])
        console.warn(output)
        console.warn(error)
        output = "error"
        return output;
    }
    return task_result
}

export async function chat(userMessage, context=null) {
    var output = "error";
    var response;
    var answer;
    try {
        // preprocessing
        var userMessage_ = userMessage.trim();
        
        // processing
        response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { "role": "user", "content": userMessage_ }
            ]
        })
        output = response.data.choices[0].message.content;
        
        // postprocessing
        answer = output;
    }
    catch (error) {
        console.warn(response.data.choices[0])
        console.warn(error)
        output = "error"
        return output;
    }
    return answer;
}