import {
  DeleteFilled,
  EditFilled,
  PlusCircleFilled,
  PlusSquareOutlined,
  StopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  Layout,
  List,
  Row,
  Segmented,
} from "antd";
import React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import Todos_Collection from "../api/Todos_Collection";
import dayjs from "dayjs";

const searchStyle = {
  width: "100%",
};

const getSize = () => {
  const screen = window.innerWidth;
  if (screen >= 1600) return "large";
  if (screen >= 1024) return "default";
  return "small";
};

const Root = () => {
  const layoutStyle = {
    minHeight: "100vh",
    minWidth: "100vw",
    display: "flex",
    flexDirection: "column",
  };
  const contentStyle = {
    padding: "20px",
    flex: "1 1 auto",
    maxHeight: "calc(100vh)",
    maxWidth: "calc(100vw)",
    overflow: "auto",
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorSuccess: "#00ff00",
          colorError: "#ff0000",
          colorWarning: "#fadb14",
          colorPrimary: "#0000ff",
          colorInfo: "#0000ff",
          colorTextBase: "#0f0f0f",
          colorBgBase: "#f0f0f0",
          fontSize: 12,
          borderRadius: 8,
          wireframe: true,
          fontFamily: "monospace",
        },
      }}
    >
      <App message={{ maxCount: 3 }} notification={{ stack: { threshold: 1 } }}>
        <Layout style={layoutStyle}>
          <Layout.Content style={contentStyle}>
            <Todos />
          </Layout.Content>
        </Layout>
      </App>
    </ConfigProvider>
  );
};

const Todos = () => {
  const { message, modal, notification } = App.useApp();
  const [searchValue, setSearchValue] = React.useState("");
  const [status, setStatus] = React.useState("open");
  const filter = React.useMemo(() => {
    const searchTerm = searchValue.trim();
    const filter = {
      status: status,
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    };
    return filter;
  }, [searchValue, status]);
  const [limit, setLimit] = React.useState(10);
  const options = React.useMemo(() => {
    const options = {
      fields: { title: 1, description: 1, dueDate: 1, status: 1 },
      sort: { dueDate: 1, title: 1 },
      limit: limit,
    };
    return options;
  }, [limit]);
  const { ready, datasource } = useTracker(() => {
    const handle = Meteor.subscribe("todos", filter, options);
    return {
      ready: handle.ready(),
      datasource: Todos_Collection.find(filter, options).fetch(),
    };
  }, [filter, options]);

  const addTodo = React.useCallback(
    (payload = { title: "", description: "", dueDate: new Date() }) => {
      payload.status = "open";
      Meteor.callAsync("todos.insert", payload)
        .then(() => {
          message.success("Task added");
        })
        .catch((error) => {
          notification.error({
            message: error.message,
            description: error.reason,
            duration: null,
          });
        });
    },
    [notification, message]
  );

  const updateTodo = React.useCallback(
    ({ _id, title, description, dueDate, status }) => {
      const todo = datasource.find((item) => item._id === _id);
      todo.title = title;
      todo.description = description;
      todo.dueDate = dueDate;
      todo.status = status;
      Meteor.callAsync("todos.update", _id, todo)
        .then(() => {
          message.success("Task updated");
        })
        .catch((error) => {
          notification.error({
            message: error.message,
            description: error.reason,
            duration: null,
          });
        });
    },
    [datasource, message, notification]
  );

  const deleteTodo = React.useCallback(
    (id) => {
      modal.error({
        title: "Are you sure you want to delete this task?",
        content: "This action cannot be undone",
        okText: "Delete, now",
        okType: "primary",
        okButtonProps: { danger: true, size: getSize() },
        cancelButtonProps: { size: getSize() },
        closable: true,
        onOk: () => {
          Meteor.callAsync("todos.delete", id)
            .then(() => {
              message.success("Task deleted");
            })
            .catch((error) => {
              notification.error({
                message: error.message,
                description: error.reason,
                duration: null,
              });
            });
        },
      });
    },
    [message, modal, notification]
  );

  const includesSearchValue = React.useCallback(
    (item) => {
      return (
        item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    },
    [searchValue]
  );

  const filteredData = React.useMemo(
    () =>
      datasource.filter((item) => {
        return includesSearchValue(item) && item.status === status;
      }),
    [datasource, status, includesSearchValue]
  );

  return (
    <List
      loading={!ready}
      loadMore={
        <LoadMore
          limit={limit}
          setLimit={setLimit}
          ready={ready}
          filter={filter}
        />
      }
      size={getSize()}
      header={
        <Header
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          status={status}
          setStatus={setStatus}
          addTodo={addTodo}
        />
      }
      dataSource={filteredData}
      renderItem={(item) => (
        <ListItem
          key={item._id}
          item={item}
          deleteTodo={deleteTodo}
          updateTodo={updateTodo}
        />
      )}
      pagination={{ simple: true, size: getSize() }}
    />
  );
};

const LoadMore = ({ limit, setLimit, ready, filter }) => {
  const { notification } = App.useApp();
  const [loading, setLoading] = React.useState(false);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!loading) {
      Meteor.callAsync("todos.count", filter)
        .then((result) => {
          setCount(result);
        })
        .catch((error) => {
          notification.error({
            message: error.message,
            description: error.reason,
            duration: null,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loading, filter, notification]);

  const styles = {
    row: {
      marginTop: 8,
    },
  };

  const handleLoadMore = React.useCallback(() => {
    setLimit(limit + 10);
  }, [setLimit, limit]);

  if (count === 0) return <></>;
  return (
    <Row gutter={[8, 8]} justify="center" align="middle" style={styles.row}>
      <Col>
        <Button
          size={getSize()}
          onClick={handleLoadMore}
          disabled={!ready || loading || limit >= count}
          loading={!ready || loading}
          icon={limit >= count ? <StopOutlined /> : <PlusSquareOutlined />}
        >
          {limit >= count ? "No more tasks" : "Load more tasks"}
        </Button>
      </Col>
    </Row>
  );
};

const AddTodoForm = ({ addTodo }) => {
  const transformDate = React.useCallback((date) => {
    return date ? date.toDate?.() : undefined;
  }, []);

  const handleFinish = React.useCallback(
    (values) => {
      addTodo?.({
        ...values,
        dueDate: transformDate(values.dueDate),
      });
    },
    [addTodo, transformDate]
  );

  return (
    <Form
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ title: "", description: "", dueDate: undefined }}
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, type: "string" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: false, type: "string" }]}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item
        name="dueDate"
        label="Due Date"
        rules={[{ required: false, type: "date" }]}
      >
        <DatePicker />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Add Task
        </Button>
      </Form.Item>
    </Form>
  );
};

const Header = ({
  searchValue,
  setSearchValue,
  status,
  setStatus,
  addTodo,
}) => {
  const { modal } = App.useApp();

  const startAdd = React.useCallback(() => {
    modal.confirm({
      title: "Add Task",
      content: <AddTodoForm addTodo={addTodo} toggleVisible={modal.close} />,
      closable: true,
      footer: null,
    });
  });

  return (
    <Row gutter={[8, 8]}>
      <Col span={24}>
        <Row gutter={[8, 8]} justify="space-between" align="middle">
          <Col flex="auto">
            <Input
              size={getSize()}
              placeholder="Search..."
              style={searchStyle}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Col>
          <Col>
            <Button
              size={getSize()}
              type="primary"
              icon={<PlusCircleFilled />}
              onClick={startAdd}
            >
              Add Task
            </Button>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Segmented
          options={[
            { label: "Open", value: "open" },
            { label: "Done", value: "done" },
          ]}
          value={status}
          onChange={setStatus}
          size={getSize()}
          block
        />
      </Col>
    </Row>
  );
};

const Title = ({ item }) => {
  const title = React.useMemo(() => {
    let title = item.title || "";
    title =
      item.title.length > 25 ? `${item.title.slice(0, 25)}...` : item.title;
    return title;
  }, [item.title]);

  const date = React.useMemo(() => {
    return item.dueDate
      ? new Intl.DateTimeFormat("en-GB").format(item.dueDate)
      : "-";
  }, [item.dueDate]);

  return `${title} (Due: ${date})`;
};

const Description = ({ item }) => {
  const description = React.useMemo(() => {
    let description =
      (item.description || "").length > 0 ? item.description : "-";
    description =
      description.length > 100
        ? `${description.slice(0, 100)}...`
        : description;
    return description;
  }, [item.description]);

  return description;
};

const UpdateTodoForm = ({ item, updateTodo }) => {
  const transformDate = React.useCallback((date) => {
    return date ? date.toDate?.() : undefined;
  }, []);
  const handleFinish = React.useCallback(
    (values) => {
      updateTodo?.({
        ...item,
        ...values,
        dueDate: transformDate(values.dueDate),
      });
    },
    [updateTodo, transformDate, item]
  );
  return (
    <Form
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        title: item.title,
        description: item.description,
        dueDate: item.dueDate ? dayjs(item.dueDate) : undefined,
      }}
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, type: "string" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: false, type: "string" }]}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item
        name="dueDate"
        label="Due Date"
        rules={[{ required: false, type: "date" }]}
      >
        <DatePicker />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Update Task
        </Button>
      </Form.Item>
    </Form>
  );
};

const ListItem = ({ item, deleteTodo, updateTodo }) => {
  const { modal } = App.useApp();

  const startEdit = React.useCallback(() => {
    modal.confirm({
      title: "Update Task",
      content: <UpdateTodoForm item={item} updateTodo={updateTodo} />,
      closable: true,
      footer: null,
    });
  }, [modal, item, updateTodo]);

  const updateStatus = React.useCallback(
    (item) => {
      modal.info({
        title: "Are you sure you want to update the status of this task?",
        content: "This action with switch the status of the task",
        okText: "Update, now",
        okType: "primary",
        okButtonProps: { size: getSize() },
        closable: true,
        onOk: () => {
          updateTodo({
            ...item,
            status: item.status === "open" ? "done" : "open",
          });
        },
      });
    },
    [modal, updateTodo]
  );

  return (
    <List.Item key={item._id}>
      <Row style={searchStyle} gutter={[8, 8]} justify="end" align="middle">
        <Col span={24}>
          <List.Item.Meta
            title={<Title item={item} />}
            description={<Description item={item} />}
          />
        </Col>
        <Col span={24}>
          <Row gutter={[8, 8]} justify="end" align="middle">
            <Col flex="auto">
              <Button
                size={getSize()}
                type="dashed"
                onClick={() => updateStatus(item)}
                icon={<SwapOutlined />}
              >
                Set status: {item.status === "open" ? "Done" : "Open"}
              </Button>
            </Col>
            <Col>
              <Button
                size={getSize()}
                type="primary"
                icon={<EditFilled />}
                onClick={startEdit}
                ghost
              >
                Update
              </Button>
            </Col>
            <Col>
              <Button
                size={getSize()}
                onClick={() => {
                  deleteTodo(item._id);
                }}
                icon={<DeleteFilled />}
                danger
              >
                Delete
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </List.Item>
  );
};

export default Root;
