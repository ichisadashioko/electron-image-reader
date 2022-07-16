const fs = require('fs');
const path = require('path');

const userdata_dir = path.join(__dirname, 'userdata');
const saved_path_list = path.join(userdata_dir, 'path_list.txt');

function get_saved_path_list() {
    if (!fs.existsSync(saved_path_list)) {
        return [];
    }

    let content_str = fs.readFileSync(saved_path_list, 'utf8');
    let lines = content_str.split('\n');
    let path_list = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        line = line.trim();

        if (line.length > 0) {
            path_list.push(line);
        }
    }

    return path_list;
}

let user_saved_path_list = get_saved_path_list();

let user_saved_path_list_container = document.getElementById('pathlist');

if (user_saved_path_list_container == null) {
    console.log('user_saved_path_list_container is null');
} else {
    for (let i = 0; i < user_saved_path_list.length; i++) {
        let path_str = user_saved_path_list[i];
        let path_div = document.createElement('div');
        path_div.innerHTML = path_str;
        user_saved_path_list_container.appendChild(path_div);
    }
}
