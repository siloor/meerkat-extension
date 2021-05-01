export const toolbarCss = `
a {
  text-decoration: none;
}

.container {
  position: relative;
  float: left;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
  font-family: 'Roboto', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 17px;
  background-color: var(--meerkat-container-background);
}

.logo {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.15);
  color: #fff;
}

.date {
  margin-left: 16px;
  color: rgba(0, 0, 0, 0.4);
}

.price-difference {
  margin-left: 16px;
}

.changes-button {
  margin-left: 16px;
}

.changes-close-button {
  margin: 8px;
}

.changes {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  background: #eee;
  width: 0;
  height: 0;
  opacity: 0;
  border-radius: 16px;
  overflow: hidden;
  transition: width 0.2s, height 0.2s, opacity 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
  display: flex;
  flex-direction: column;
}

.changes-container {
  padding: 10px 10px 0 10px;
  overflow: auto;
  flex-grow: 1;
}

.changes-container-inner {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.changes table {
  table-layout: fixed;
  width: 100%;
  border-spacing: 0;
}

.changes table th {
  padding: 8px;
  position: sticky;
  top: 0;
  background: #eee;
  box-shadow: inset 0 -1px 0 #bbb;
  font-size: 14px;
  color: #999;
}

.changes table td {
  padding: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-button {
  margin-left: 16px;
  color: rgba(0, 0, 0, 0.4);
}

.note-button:hover, .note-button.active {
  color: rgba(0, 0, 0, 0.8);
}

.note-button span span {
  display: inline-block;
  vertical-align: text-bottom;
  line-height: initial;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60px;
}

.note-close-button {
  margin: 8px;
}

.note {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  background: #eee;
  width: 0;
  height: 0;
  opacity: 0;
  border-radius: 16px;
  overflow: hidden;
  transition: width 0.2s, height 0.2s, opacity 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
  display: flex;
  flex-direction: column;
}

.note-container {
  padding: 0 10px 0 10px;
  overflow: auto;
  flex-grow: 1;
}

.note-container-inner {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.note-container-inner textarea {
  display: block;
  resize: none;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  border: 0;
  width: 100%;
  height: 100%;
  font-family: inherit;
  font-size: 13px;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.5s ease;
  background-color: rgba(0, 0, 0, 0.1);
}

.note-container-inner textarea:focus {
  background-color: rgba(255, 255, 255, 0.6);
}

.note-header {
  padding: 10px;
  font-size: 14px;
}

.note-form {
  float: right;
}

.note-form button {
  margin: 5px 20px 5px 0;
  box-sizing: content-box;
  padding: 4px 14px;
  height: 16px;
  border: 1px solid #999;
  border-radius: 4px;
  font-size: 13px;
}

.note-form button:focus {
  outline: 0;
  border: 2px solid #000;
  padding: 3px 13px;
}

.colors-button {
  margin-left: 16px;
  margin-right: 6px;
  float: right;
  position: relative;
  opacity: 0.5;
}

.colors-button.open {
  opacity: 1;
}

.colors-button-icon {
  width: 20px;
  height: 20px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}

.colors-button-icon span {
  display: block;
  float: left;
  width: 10px;
  height: 10px;
}

.colors-button-icon span:nth-child(1) {
  border-top-left-radius: 10px;
  background: #f86b43;
}

.colors-button-icon span:nth-child(2) {
  border-top-right-radius: 10px;
  background: #92c523;
}

.colors-button-icon span:nth-child(3) {
  border-bottom-left-radius: 10px;
  background: #01b6f1;
}

.colors-button-icon span:nth-child(4) {
  border-bottom-right-radius: 10px;
  background: #ffc644;
}

.colors-container {
  display: none;
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 168px;
  height: 60px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}

.colors-button.open .colors-container {
  display: block;
}

.colors-color-button {
  display: inline-block;
  width: 20px;
  height: 20px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  margin: 4px;
}
`;
