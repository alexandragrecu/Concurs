const express = require('express')
const bodyParser = require('body-parser')
const uuidv4 = require('uuidv4')
const dbsync = require('./dbsync')

const app = express()
const port = 3000

let db = dbsync.load()

app.use(bodyParser.json())

/**
 * Routes
 */

app.get('/api/category', (req, res) => {
    res.status(200).json(db)
})

app.get('/api/category/:categoryId', (req, res) => {
    const categoryId = req.params.categoryId
    if (categoryId in db) {
        res.status(200).json({
            message: 'OK',
            data: db[categoryId]
        })
    } else {
        res.status(404).json({
            message: "Category not found"
        })
    }
})

app.get('/api/category/:categoryId/question/:id', (req, res) => {
    const categoryId = req.params.categoryId
    const id = req.params.id
    if (categoryId in db && id in db[categoryId].questions) {
        res.status(200).json({
            message: "OK",
            data: db[categoryId].questions[id]
        })
    } else {
        res.status(404).json({
            message: "Question not found"
        })
    }
})

app.post('/api/category', (req, res) => {
    const categoryId = uuidv4()
    const name = req.body.name
    db[categoryId] = {
        name: name,
        questions: {}
    }
    dbsync.save(db)
    res.status(200).json({
        message: "OK",
        data: categoryId
    })
})

app.post('/api/category/:categoryId/question', (req, res) => {
    const categoryId = req.params.categoryId
    const id = uuidv4()
    const statement = req.body.statement
    const marks = req.body.marks
    const options = req.body.options

    db[categoryId].questions[id] = {
        statement: statement,
        marks: marks,
        options: options
    }
    dbsync.save(db)
    res.status(200).json({
        message: "OK",
        data: id
    })
})

app.delete('/api/category/:categoryId', (req, res) => {
    const categoryId = req.params.categoryId
    if (categoryId in db) {
        delete db[categoryId]
        dbsync.save(db)
        res.status(200).json({
            message: 'OK',
            data: categoryId
        })
    } else {
        res.status(404).json({
            message: "Category not found"
        })
    }
})

app.delete('/api/category/:categoryId/question/:id', (req, res) => {
    const categoryId = req.params.categoryId
    const id = req.params.id
    if (categoryId in db && id in db[categoryId].questions) {
        delete db[categoryId].questions[id]
        dbsync.save(db)
        res.status(200).json({
            message: "OK",
            data: id
        })
    } else {
        res.status(404).json({
            message: "Question not found"
        })
    }
})

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

app.post('/api/test', (req, res) => {
    const distrib = {
        10: 2,
        6: 4,
        5: 10,
        4: 4
    }

    questions = []
    for (let points in distrib) {
        let curr = {}
        let profCategoryId = null
        for (let category in db) {
            if (points == 4 && db[category].name === 'PROFESIONALA') {
                profCategoryId = category
                continue
            }
            curr[category] = []
            for (let question in db[category].questions) {
                if (db[category].questions[question].marks != points)
                    continue
                curr[category].push(db[category].questions[question]) 
            }
            curr[category] = shuffle(curr[category])
        }
        ok = true
        cnt = 0
        while (ok) {
            ok = false
            for (let category in curr) {
                if (curr[category].length > 0) {
                    ok = true
                    questions.push(curr[category][curr[category].length - 1])
                    cnt++
                    if (cnt == distrib[points]) {
                        ok = false
                        break
                    }
                    curr[category].pop()
                }
            }
        }
        if (points == 4) {
            let profQuestions = []
            for (let i in db[profCategoryId].questions)
                if (db[profCategoryId].questions[i].marks == points)
                profQuestions.push(db[profCategoryId].questions[i])
            profQuestions = shuffle(profQuestions)
            for (let i = 0; i < 10; ++i)
                questions.push(profQuestions[i])
        }

    }
    res.status(200).json({
        message: "OK",
        data: shuffle(questions)
    })
})

app.use(express.static('public'))
app.listen(port, () => console.log(`Server listening on port ${port}`))
