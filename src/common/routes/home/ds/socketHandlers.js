import io from 'socket.io-client';

export default function createSocketHandlers(context) {
  const { props, getState, setState, setSocket, component, ref, dispatch, apiUrl } = context;
  let socket = null;

  function init() {
    const { match, user } = props;
    let dsName = match.params.dsName;

    socket = io(apiUrl, {
      extraHeaders: {
        Cookie: document.cookie
      }
    });

    // allow caller to access module-scoped socket
    if (setSocket) setSocket(socket);

    const me = component;

    socket.on('connect', () => {
      socket.emit('Hello', { user: user.user });
      socket.emit('getActiveLocks', dsName);
      if (me && me.setState) me.setState({ connectedState: true });
    });

    socket.on('disconnect', () => {
      if (me && me.setState) me.setState({ connectedState: false });
    });

    socket.on('dbConnectivityState', (isDbConnected) => {
      if (me && me.setState) me.setState({ dbconnectivitystate: isDbConnected.dbState });
    });

    socket.on('Hello', () => {});

    socket.on('activeLocks', (activeLocks) => {
      if (!ref || !ref()) return;
      activeLocks = JSON.parse(activeLocks);
      let keys = Object.keys(activeLocks);
      for (let i = 0; i < keys.length; i++) {
        let _id = keys[i];
        let rows = ref().table.searchRows("_id", "=", _id);
        if (!rows.length) continue;
        let fields = Object.keys(activeLocks[_id]);
        for (let j = 0; j < fields.length; j++) {
          let field = fields[j];
          let cell = rows[0].getCell(field);
          activeLocks[_id][field] = cell;
          if (!cell) continue;
          if (me && me.cellImEditing === cell) {
            cell.cancelEdit();
          }
          cell.getElement().style.backgroundColor = 'lightGray';
        }
      }
      // store lockedByOthersCells on component
      if (me) me.lockedByOthersCells = activeLocks;
    });

    socket.on('locked', (lockedObj) => {
      if (!ref || !ref()) return;
      const { match } = props;
      let dsView = match.params.dsView;
      if (match.params.dsName === lockedObj.dsName) {
        let rows = ref().table.searchRows("_id", "=", lockedObj._id);
        if (!rows.length) return;
        let cell = rows[0].getCell(lockedObj.field);
        if (!me.lockedByOthersCells[lockedObj._id]) me.lockedByOthersCells[lockedObj._id] = {};
        me.lockedByOthersCells[lockedObj._id][lockedObj.field] = cell;
        if (me.cellImEditing === cell) cell.cancelEdit();
        cell.getElement().style.backgroundColor = 'lightGray';
      }
    });

    socket.on('unlocked', (unlockedObj) => {
      let adjustTableHeight = false;
      try {
        if (!ref || !ref()) return;
        const { match } = props;
        if (match.params.dsName === unlockedObj.dsName && me.lockedByOthersCells[unlockedObj._id] && me.lockedByOthersCells[unlockedObj._id][unlockedObj.field]) {
          let cell = me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
          delete me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
          if (unlockedObj.newVal !== undefined && unlockedObj.newVal !== null) {
            let update = { _id: unlockedObj._id };
            update[unlockedObj.field] = unlockedObj.newVal;
            ref().table.updateData([ update ]);
            adjustTableHeight = true;
          }
          cell.getElement().style.backgroundColor = '';
          let colDef = cell.getColumn().getDefinition();
          colDef.formatter(cell, colDef.formatterParams);
        } else if (match.params.dsName === unlockedObj.dsName && unlockedObj.newVal) {
          let rows = ref().table.searchRows("_id", "=", unlockedObj._id);
          if (!rows.length) return;
          let update = { _id: unlockedObj._id };
          update[unlockedObj.field] = unlockedObj.newVal;
          ref().table.updateData([ update ]);
          adjustTableHeight = true;
        }
      } catch (e) {}
      if (adjustTableHeight && !me.cellImEditing) {
        if (me.timers["post-cell-edited"]) {
          clearTimeout(me.timers["post-cell-edited"]);
          me.timers["post-cell-edited"] = null;
        }
        me.timers["post-cell-edited"] = setTimeout(() => {
          if (!me.cellImEditing) {
            me.ref.table.rowManager.adjustTableSize(false);
            me.normalizeAllImgRows();
            me.applyHighlightJsBadge();
            me.renderPlotlyInCells();
          }
        }, 500);
      }
    });

    socket.on('exception', (msg) => {
      console.log('GOT exception:', msg);
    });
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  return {
    init,
    disconnect,
    getSocket: () => socket
  };
}
// end
