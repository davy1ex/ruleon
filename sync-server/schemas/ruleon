CREATE TABLE IF NOT EXISTS outline_nodes (
  id TEXT PRIMARY KEY NOT NULL DEFAULT '',
  parent_id TEXT,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  collapsed INTEGER NOT NULL DEFAULT 0,
  task_status TEXT,
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

SELECT crsql_as_crr('outline_nodes');

CREATE INDEX IF NOT EXISTS idx_outline_parent_sort
  ON outline_nodes(parent_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_outline_nodes_task_todo
  ON outline_nodes(task_status)
  WHERE task_status = 'TODO';

CREATE TABLE IF NOT EXISTS node_links (
  source_id TEXT NOT NULL,
  target_name_normalized TEXT NOT NULL,
  type TEXT NOT NULL,
  PRIMARY KEY (source_id, target_name_normalized, type),
  FOREIGN KEY (source_id) REFERENCES outline_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_node_links_target ON node_links(target_name_normalized);

CREATE TABLE IF NOT EXISTS block_links (
  source_block_id TEXT NOT NULL DEFAULT '',
  target_text TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (source_block_id, target_text)
);

SELECT crsql_as_crr('block_links');

CREATE INDEX IF NOT EXISTS idx_block_links_target ON block_links(target_text);

CREATE TABLE IF NOT EXISTS favorites (
  node_id TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL,
  FOREIGN KEY (node_id) REFERENCES outline_nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trashed_nodes (
  node_id TEXT PRIMARY KEY,
  trashed_at INTEGER NOT NULL,
  FOREIGN KEY (node_id) REFERENCES outline_nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kv_state (
  key TEXT PRIMARY KEY NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT ''
);

SELECT crsql_as_crr('kv_state');
