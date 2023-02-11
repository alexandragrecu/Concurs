const path = 'http://localhost:3000/api/'

window.addEventListener('load', () => {
    let app = document.getElementById('app')

    let removeSubtree = element => {
        while (element.firstChild)
            element.removeChild(element.firstChild)
    }

    let testBtn = document.getElementById('testBtn')
    let timerId = null
    testBtn.addEventListener('click', () => {
        removeSubtree(app)
        let timeCounter = document.createElement('h3')
        timeCounter.classList.add('timer')
        let countdown = 30 * 60 * 1000
        if (timerId)
            clearInterval(timerId)
        timerId = setInterval(() => {
            countdown -= 1000
            let min = Math.floor(countdown / (60 * 1000))
            let sec = Math.floor((countdown - (min * 60 * 1000)) / 1000);

            if (countdown <= 0) {
                alert("Timpul a expirat!")
                clearInterval(timerId)
                timerId = null
            } else {
                timeCounter.innerText = `${min}:${sec}`
            }
        }, 1000)
        app.appendChild(timeCounter)

        $.ajax({
            url: path + 'test',
            method: 'post',
            success: response => {
                let test = document.createElement('ol')
                test.type = '1'
                for (let i in response.data) {
                    let li = document.createElement('li')
                    let statement = document.createElement('p')
                    statement.innerText = '(' + response.data[i].marks + 'p) ' + response.data[i].statement
                    li.appendChild(statement)
                    for (let j = 0; j < response.data[i].options.length; ++j) {
                        let label = document.createElement('label')
                        label.innerHTML = `<input type="checkbox" value=${j}><span>${response.data[i].options[j][0]}</span><br>`
                        li.appendChild(label)
                    }
                    test.appendChild(li)
                }
                app.appendChild(test)

                let submit = document.createElement('button')
                submit.innerText = 'Submit'
                app.appendChild(submit)
                submit.onclick = () => {
                    if (submit.parentNode.lastChild.nodeName == 'H3')
                        submit.parentNode.removeChild(submit.parentNode.lastChild)
                    let score = 0
                    let question = test.firstChild
                    for (let i in response.data) {
                        while (question.nodeName != 'LI')
                            question = question.nextSibling
                        let selected = question.querySelectorAll('input[type=checkbox]:checked')
                        let ok = true
                        let cnt = 0
                        for (item of selected)
                            if (response.data[i].options[item.value][1] == 0)
                                ok = false
                            else
                                cnt++
                        for (item of response.data[i].options)
                            if (item[1] == 1)
                                cnt--
                        let elems = question.querySelectorAll(`input[type="checkbox"] ~ span`)
                        elems.forEach(element => {
                            element.style.color = 'black'
                        });
                        if (cnt == 0 && ok) {
                            score += response.data[i].marks
                            for (item in response.data[i].options)
                                if (response.data[i].options[item][1] == 1)
                                    question.querySelector(`input[type="checkbox"][value="${item}"] ~ span`).style.color = 'green'
                        } else {
                            for (item in response.data[i].options)
                                if (response.data[i].options[item][1] == 1)
                                    question.querySelector(`input[type="checkbox"][value="${item}"] ~ span`).style.color = 'red'
                        }
                        question = question.nextSibling
                    }

                    let res = document.createElement('h3')
                    res.innerText = `Scor: ${score}`
                    submit.parentNode.appendChild(res)
                }
            }
        })
    })
    
    let lastBtn = null
    function categoryButtonOnClick(btn, container, id) {
        if (lastBtn)
            lastBtn.style.color = 'black'
        btn.style.color = 'blue'
        lastBtn = btn

        removeSubtree(container)
        $.ajax({
            url: path + 'category/' + id,
            method: 'get',
            success: res => {
                let questions = document.createElement('ol')
                for (let [it, question] of Object.entries(res.data.questions)) {
                    let q = question.statement + '\n' + question.marks + '\n'
                    for (let opt of question.options)
                        q += `${opt[0]} (${opt[1]}); `
                    let li = document.createElement('li')
                    li.innerText = q

                    let del = document.createElement('button')
                    del.innerText = "DELETE"
                    li.appendChild(del)
                    del.onclick = () => {
                        li.parentElement.removeChild(li)
                        $.ajax({
                            url: path + 'category/' + id + '/question/' + it,
                            method: 'delete',
                            success: () => {}
                        })
                    }

                    questions.appendChild(li)
                }
                container.appendChild(questions)

                let statementInput = document.createElement('input')
                statementInput.placeholder = 'Enunt'
                let marksInput = document.createElement('input')
                marksInput.placeholder = 'Punctaj'
                let optionsSelect = document.createElement('select')
                for (let i = 0; i <= 10; ++i) {
                    let option = document.createElement('option')
                    option.value = option.textContent = i
                    optionsSelect.appendChild(option)
                }
                container.appendChild(statementInput)
                container.appendChild(marksInput)
                container.appendChild(optionsSelect)

                let addBtn = document.createElement('button')
                addBtn.innerText = 'ADD'
                container.appendChild(addBtn)

                let optionInputs = []
                let optionChecks = []
                optionsSelect.onchange = () => {
                    while (optionInputs.length > optionsSelect.value) {
                        container.removeChild(optionChecks[optionChecks.length - 1])
                        container.removeChild(optionInputs[optionInputs.length - 1])
                        optionChecks.pop()
                        optionInputs.pop()
                    }

                    while (optionInputs.length < optionsSelect.value) {
                        optionInputs.push(document.createElement('input'))
                        optionChecks.push(document.createElement('input'))
                        optionChecks[optionChecks.length - 1].setAttribute('type', 'checkbox')
                        container.insertBefore(optionInputs[optionInputs.length - 1], addBtn)
                        container.insertBefore(optionChecks[optionChecks.length - 1], addBtn)
                        optionInputs[optionInputs.length - 1].placeholder = `Varianta ${optionInputs.length}`
                    }
                }

                addBtn.onclick = () => {
                    let q = {}
                    q.statement = statementInput.value
                    q.marks = parseInt(marksInput.value)
                    q.options = []
                    for (let i in optionInputs)
                        q.options.push([optionInputs[i].value, optionChecks[i].checked ? 1 : 0])
                    $.ajax({
                        url: path + 'category/' + id + '/question',
                        method: 'post',
                        data: JSON.stringify(q),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: response => {
                            let qId = response.data
                            let qs = q.statement + '\n' + q.marks + '\n'
                            for (let opt of q.options)
                                qs += `${opt[0]} (${opt[1]}); `
                            let li = document.createElement('li')
                            li.innerText = qs

                            let del = document.createElement('button')
                            del.innerText = "DELETE"
                            li.appendChild(del)
                            del.onclick = () => {
                                li.parentElement.removeChild(li)
                                $.ajax({
                                    url: path + 'category/' + id + '/question/' + qId,
                                    method: 'delete',
                                    success: () => {}
                                })
                            }

                            questions.appendChild(li)          
                        }
                    })
                }
            }
        })
    }

    let editBtn = document.getElementById('editBtn')
    editBtn.addEventListener('click', () => {
        removeSubtree(app)
        if (timerId)
            clearInterval(timerId)
        $.ajax({
            url: path + 'category',
            method: 'get',
            success: response => {
                let container = document.createElement('div')
                container.id = 'container'
                for (let id in response) {
                    let btn = document.createElement('button')
                    btn.innerText = response[id].name
                    app.appendChild(btn)
                    btn.onclick = () => {
                        categoryButtonOnClick(btn, container, id)
                    }
                }
                let br = document.createElement('br')
                app.appendChild(br)

                let addCategoryBtn = document.createElement('button')
                addCategoryBtn.innerText = 'Creeaza categorie'
                let addCategoryInput = document.createElement('input')
                app.appendChild(addCategoryInput)
                app.appendChild(addCategoryBtn)
                addCategoryBtn.onclick = () => {
                    let name = addCategoryInput.value
                    addCategoryInput.textContent = ''
                    $.ajax({
                        url: path + 'category',
                        method: 'post',
                        data: JSON.stringify({ name: name }),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: response => {
                            let id = response.data
                            let btn = document.createElement('button')
                            btn.innerText = name
                            app.insertBefore(btn, br)
                            btn.onclick = () => {
                                categoryButtonOnClick(btn, container, id)
                            }
                        }
                    })
                }

                app.appendChild(container)
            }
        })
    })
})
