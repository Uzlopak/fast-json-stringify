'use strict'

const path = require('path')
const { Worker } = require('worker_threads')

const BENCH_THREAD_PATH = path.join(__dirname, 'bench-thread.js')

const LONG_STRING_LENGTH = 1e4
const SHORT_ARRAY_SIZE = 1e3

const shortArrayOfNumbers = new Array(SHORT_ARRAY_SIZE)
const shortArrayOfIntegers = new Array(SHORT_ARRAY_SIZE)
const shortArrayOfShortStrings = new Array(SHORT_ARRAY_SIZE)
const shortArrayOfLongStrings = new Array(SHORT_ARRAY_SIZE)
const shortArrayOfMultiObject = new Array(SHORT_ARRAY_SIZE)

function getRandomInt (max) {
  return Math.floor(Math.random() * max)
}

let longSimpleString = ''
for (let i = 0; i < LONG_STRING_LENGTH; i++) {
  longSimpleString += i
}

let longString = ''
for (let i = 0; i < LONG_STRING_LENGTH; i++) {
  longString += i
  if (i % 100 === 0) {
    longString += '"'
  }
}

for (let i = 0; i < SHORT_ARRAY_SIZE; i++) {
  shortArrayOfNumbers[i] = getRandomInt(1000)
  shortArrayOfIntegers[i] = getRandomInt(1000)
  shortArrayOfShortStrings[i] = 'hello world'
  shortArrayOfLongStrings[i] = longString
  shortArrayOfMultiObject[i] = { s: 'hello world', n: 42, b: true }
}

const benchmarks = [
  {
    name: 'short string',
    schema: {
      type: 'string'
    },
    input: 'hello world'
  },
  {
    name: 'short string with double quote',
    schema: {
      type: 'string'
    },
    input: 'hello " world'
  }
]

async function runBenchmark (benchmark) {
  const worker = new Worker(BENCH_THREAD_PATH, { workerData: benchmark })

  return new Promise((resolve, reject) => {
    let result = null
    worker.on('error', reject)
    worker.on('message', (benchResult) => {
      result = benchResult
    })
    worker.on('exit', (code) => {
      if (code === 0) {
        resolve(result)
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

async function runBenchmarks () {
  let maxNameLength = 0
  for (const benchmark of benchmarks) {
    maxNameLength = Math.max(benchmark.name.length, maxNameLength)
  }

  for (const benchmark of benchmarks) {
    benchmark.name = benchmark.name.padEnd(maxNameLength, '.')
    const resultMessage = await runBenchmark(benchmark)
    console.log(resultMessage)
  }
}

runBenchmarks()
