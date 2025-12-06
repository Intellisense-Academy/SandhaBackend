const express = require('express');
const app = express();
app.use(express.json()); 

let users = [];
app.post('/users', (req, res) => {
    const { id, name, phone } = req.body;
    users.push({ id, name, phone });
    res.status(201).send("User added successfully");
});

app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, phone } = req.body;

    const user = users.find(u => u.id == userId);
    if(!user) {
        return res.status(404).send("User not found");
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    res.send("User updated successfully");
});

app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;

    const index = users.findIndex(u => u.id == userId);
    if(index === -1) {
        return res.status(404).send("User not found");
    }

    users.splice(index, 1);

    res.send("User deleted successfully");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
