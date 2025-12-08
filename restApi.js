const express = require('express');
const app = express();

app.use(express.json()); 


let users = [];
let nextId = 1; 


app.post('/users', (req, res) => {
    const { name, phone } = req.body;

    const newUser = {
        id: nextId++,
        name,
        phone
    };

    users.push(newUser);
    res.status(201).json({
        message: "User added successfully",
        user: newUser
    });
});


app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, phone } = req.body;

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    res.json({
        message: "User updated successfully",
        user
    });
});


app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    users.splice(index, 1);
    res.json({ message: "User deleted successfully" });
});

// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
