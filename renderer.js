const fs = require('fs');
const path = require('path');

const userdata_dir = path.join(__dirname, 'userdata');
const saved_path_list = path.join(userdata_dir, 'path_list.txt');

var listing_lock = {};

const IMAGE_EXTENSION_LIST = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'tiff',
    'tif',
    'ico',
];

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

function generate_child_file_entry_dom_node(
    filepath,
    file_name,
    dirent_obj,
) {
    let container = document.createElement('div');

    let file_type_icon = document.createElement('i');
    file_type_icon.classList.add('bi');
    file_type_icon.classList.add('file_type_icon');

    if (dirent_obj.isDirectory()) {
        file_type_icon.classList.add('bi-folder');
        container.classList.add('filetype_directory');
    } else if (dirent_obj.isFile()) {
        file_type_icon.classList.add('bi-file-earmark');
        container.classList.add('filetype_regular_file');
    } else if (dirent_obj.isSymbolicLink()) {
        file_type_icon.classList.add('bi-folder-symlink');
        container.classList.add('filetype_symbolic_link');
    }
    else {
        file_type_icon.classList.add('bi-file-earmark-x');
        container.classList.add('filetype_unknown');
    }

    let file_name_holder = document.createElement('p');
    file_name_holder.classList.add('file-name-holder');
    file_name_holder.textContent = file_name;
    file_name_holder.addEventListener('click', function (evt) {
        on_file_name_click(
            evt,
            container,
            filepath,
        );
    });

    container.appendChild(file_type_icon);
    container.appendChild(file_name_holder);

    return container;
}

/**
 * @param {MouseEvent} evt
 * @param {HTMLElement} container_dom_node
 * @param {string} filepath
 */
function on_file_name_click(
    evt,
    container_dom_node,
    filepath,
) {
    console.debug(evt);
    if (container_dom_node.lock != null) {
        console.log('on_file_name_click: container_dom_node.lock != null');
        console.log(arguments);
        console.log(container_dom_node);
        // TODO log message
        return;
    }

    container_dom_node.lock = true;
    let is_lock_passed = false;

    try {
        let file_stat = fs.statSync(filepath);

        if (file_stat.isDirectory()) {
            if (listing_lock[filepath] != null) {
                console.log(`${filepath} listing is locked`);
            } else {
                try {
                    listing_lock[filepath] = true;
                    is_lock_passed = true;

                    fs.readdir(
                        filepath,
                        {
                            withFileTypes: true,
                            encoding: 'utf8',
                        },
                        function (err, dirent_array) {
                            listing_lock[filepath] = null;

                            if (err != null) {
                                console.error(`fs.readdir ${filepath} error`);
                                console.error(err);
                                container_dom_node.lock = null;
                                return;
                            }

                            // TODO customize sorting
                            // TODO store selected sorting method for each directory

                            let child_file_entry_dom_nodes = [];
                            // TODO show empty directory indicator
                            for (let i = 0; i < dirent_array.length; i++) {
                                let dirent_obj = dirent_array[i];
                                let child_filepath = path.join(filepath, dirent_obj.name);

                                let child_file_entry_dom_node = generate_child_file_entry_dom_node(
                                    child_filepath,
                                    dirent_obj.name,
                                    dirent_obj,
                                );

                                child_file_entry_dom_nodes.push(child_file_entry_dom_node);
                            }

                            let children_container = container_dom_node.getElementsByClassName('children_container')[0];
                            container_dom_node.children
                            if (children_container == null) {
                                // console.log('children_container is null');
                                children_container = document.createElement('div');
                                children_container.className = 'children_container';

                                container_dom_node.appendChild(children_container);
                            }

                            children_container.innerHTML = '';
                            for (let i = 0; i < child_file_entry_dom_nodes.length; i++) {
                                children_container.appendChild(child_file_entry_dom_nodes[i]);
                            }

                            container_dom_node.lock = null;
                        }
                    )
                } catch (listing_error) {
                    console.error(`${filepath} listing error`);
                    console.error(listing_error);
                }
            }
        } else if (file_stat.isFile()) {
            let file_extension = path.extname(filepath);
            if (file_extension.length < 1) {
                console.log(`${filepath} does not have extension indicator in file name`);
            } else {
                file_extension = file_extension.substring(1).toLowerCase();
                if (IMAGE_EXTENSION_LIST.indexOf(file_extension) < 0) {
                    console.log(`${filepath} is not a supported image file type`);
                } else {
                    // TODO handle lazy loading in array of images
                    let image_panel = document.getElementById('image_panel');
                    if (image_panel == null) {
                        console.error('image_panel is null');
                    } else {
                        if (image_panel.lock == null) {
                            image_panel.lock = true;

                            image_panel.replaceChildren();

                            let image_dom_node = document.createElement('img');
                            image_panel.appendChild(image_dom_node);

                            setTimeout(function () {
                                // TODO uri encode each file name in path
                                image_dom_node.src = filepath;
                            }, 0);

                            image_panel.lock = null;
                        } else {
                            console.log('image_panel.lock != null');
                            console.log(image_panel);
                        }
                    }
                }
            }
        } else {
            console.error(`unhandled file type: ${filepath}`);
        }
    } catch (error) {
        console.error(error);
    }

    if (!is_lock_passed) {
        container_dom_node.lock = null;
    }
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
        file_name_holder.addEventListener('click', function (evt) {
            on_file_name_click(
                evt,
                path_div,
                path_str,
            );
        });

        user_saved_path_list_container.appendChild(path_div);
    }
}

var toggle_file_browsing_key_down = false;
const TOGGLE_FILE_BROWSING_KEY_CODE = 'F1';

document.addEventListener('keydown', function (evt) {
    if (evt.defaultPrevented) {
        console.debug(evt);
        return;
    }

    console.debug(`keydown - code ${evt.code} - key ${evt.key}`);

    if (evt.key === TOGGLE_FILE_BROWSING_KEY_CODE) {
        evt.preventDefault();

        if (toggle_file_browsing_key_down) {
            console.debug(`${evt.key} is not released!`);
            return;
        }

        toggle_file_browsing_key_down = true;
        let file_browsing_panel = document.getElementById('pathlist');
        if (file_browsing_panel == null) {
            console.error('file_browsing_panel == null');
        } else {
            if (file_browsing_panel.style.display === 'none') {
                file_browsing_panel.style.display = null;
            } else {
                file_browsing_panel.style.display = 'none';
            }
        }
    }
});

document.addEventListener('keyup', function (evt) {
    if (evt.defaultPrevented) {
        console.debug(evt);
        return;
    }

    console.debug(`keyup - code ${evt.code} - key ${evt.key}`);

    if (evt.key === TOGGLE_FILE_BROWSING_KEY_CODE) {
        evt.preventDefault();
        toggle_file_browsing_key_down = false;
    }
});
