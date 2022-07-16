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

let GLOBAL_USER_SAVED_PATH_DICT = {};

for (let i = 0; i < user_saved_path_list.length; i++) {
    let path_str = user_saved_path_list[i];

    let is_path_still_exist = fs.existsSync(path_str);

    GLOBAL_USER_SAVED_PATH_DICT[path_str] = {
        expanded: false,
        children: [],
        exist: is_path_still_exist,
        listing: false,
    };
}

let user_saved_path_list_container = document.getElementById('pathlist');

if (user_saved_path_list_container == null) {
    console.log('user_saved_path_list_container is null');
} else {
    for (let i = 0; i < user_saved_path_list.length; i++) {
        let path_str = user_saved_path_list[i];

        let icon_element = document.createElement('i');
        icon_element.className = 'bi bi-file-earmark-x';
        let file_name_holder = document.createElement('p');
        file_name_holder.className = 'file-name-holder';
        file_name_holder.textContent = path_str;

        let path_div = document.createElement('div');
        path_div.appendChild(icon_element);
        path_div.appendChild(file_name_holder);
        // path_div.innerHTML = path_str;
        path_div.addEventListener('click', function () {
            if (GLOBAL_USER_SAVED_PATH_DICT[path_str].listing) {
                console.log(`${path_str} is listing`);
            }
            // TODO expand style tree
            // TODO keep child tree expanded

            GLOBAL_USER_SAVED_PATH_DICT[path_str].expanded = !GLOBAL_USER_SAVED_PATH_DICT[path_str].expanded;
            if (GLOBAL_USER_SAVED_PATH_DICT[path_str].expanded) {
                let children_container = path_div.getElementsByClassName('children_container')[0];
                if (children_container == null) {
                    console.log('children_container is null');
                    children_container = document.createElement('div');
                    children_container.className = 'children_container';

                    path_div.appendChild(children_container);
                }

                GLOBAL_USER_SAVED_PATH_DICT[path_str].listing = true;

                fs.readdir(
                    path_str,
                    {
                        withFileTypes: true,
                        encoding: 'utf8',
                    },
                    function (error, files) {
                        GLOBAL_USER_SAVED_PATH_DICT[path_str].listing = false;
                        if (error) {
                            console.log(error);
                            // TODO show error message / indicator
                            return;
                        }

                        // TODO update/refresh children node
                        // and keep expansion state

                        children_container.innerHTML = '';
                        GLOBAL_USER_SAVED_PATH_DICT[path_str].children = [];

                        for (let i = 0; i < files.length; i++) {
                            let file_info = files[i];
                            let in_memory_file_info = {
                                'fs.Dirent': file_info,
                            }

                            GLOBAL_USER_SAVED_PATH_DICT[path_str].children.push(in_memory_file_info);

                            let child_div = document.createElement('div');
                            let file_type_div = document.createElement('i');
                            file_type_div.classList.add('file_type_icon')
                            file_type_div.classList.add('bi')

                            if (file_info.isDirectory()) {
                                file_type_div.classList.add('bi-folder');
                            } else if (file_info.isFile()) {
                                file_type_div.classList.add('bi-file-earmark');
                            } else if (file_info.isSymbolicLink()) {
                                file_type_div.classList.add('bi-folder-symlink');
                            }
                            else {
                                file_type_div.classList.add('bi-file-earmark-x');
                            }

                            let file_name_holder = document.createElement('p');
                            file_name_holder.classList.add('file-name-holder');
                            file_name_holder.textContent = file_info.name;

                            child_div.appendChild(file_type_div);
                            child_div.appendChild(file_name_holder);

                            children_container.appendChild(child_div);
                        }
                    }
                )
            }
        });

        user_saved_path_list_container.appendChild(path_div);
    }
}
