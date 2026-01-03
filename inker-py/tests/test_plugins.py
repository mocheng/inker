"""Tests for tool plugins."""

import pytest
from pathlib import Path
import tempfile
import os

from inker_py.model.plugins.bash import BashPlugin
from inker_py.model.plugins.read_file import ReadFilePlugin
from inker_py.model.plugins.write_file import WriteFilePlugin
from inker_py.model.plugins.edit_file import EditFilePlugin
from inker_py.model.plugins.list_directory import ListDirectoryPlugin
from inker_py.model.plugins.git import GitPlugin


class TestBashPlugin:
    """Tests for BashPlugin."""

    @pytest.fixture
    def plugin(self):
        return BashPlugin()

    @pytest.mark.asyncio
    async def test_execute_echo(self, plugin):
        result = await plugin.execute({"command": "echo 'hello world'"})
        assert result.success is True
        assert "hello world" in result.data["stdout"]

    @pytest.mark.asyncio
    async def test_execute_failing_command(self, plugin):
        result = await plugin.execute({"command": "exit 1"})
        assert result.success is False
        assert result.data["exit_code"] == 1

    def test_get_name(self, plugin):
        assert plugin.get_name() == "bash"

    def test_to_openai_tool(self, plugin):
        tool = plugin.to_openai_tool()
        assert tool["type"] == "function"
        assert tool["function"]["name"] == "bash"
        assert "command" in tool["function"]["parameters"]["properties"]


class TestReadFilePlugin:
    """Tests for ReadFilePlugin."""

    @pytest.fixture
    def plugin(self):
        return ReadFilePlugin()

    @pytest.mark.asyncio
    async def test_read_existing_file(self, plugin):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("test content")
            f.flush()
            temp_path = f.name

        try:
            result = await plugin.execute({"path": temp_path})
            assert result.success is True
            assert result.data["content"] == "test content"
            assert result.data["size"] == 12
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_read_nonexistent_file(self, plugin):
        result = await plugin.execute({"path": "/nonexistent/file.txt"})
        assert result.success is False
        assert result.error is not None


class TestWriteFilePlugin:
    """Tests for WriteFilePlugin."""

    @pytest.fixture
    def plugin(self):
        return WriteFilePlugin()

    @pytest.mark.asyncio
    async def test_write_file(self, plugin):
        with tempfile.TemporaryDirectory() as tmpdir:
            file_path = os.path.join(tmpdir, "test.txt")
            result = await plugin.execute({"path": file_path, "content": "hello"})
            
            assert result.success is True
            assert result.data["size"] == 5
            assert Path(file_path).read_text() == "hello"

    @pytest.mark.asyncio
    async def test_write_file_creates_directories(self, plugin):
        with tempfile.TemporaryDirectory() as tmpdir:
            file_path = os.path.join(tmpdir, "subdir", "nested", "test.txt")
            result = await plugin.execute({"path": file_path, "content": "nested content"})
            
            assert result.success is True
            assert Path(file_path).read_text() == "nested content"


class TestEditFilePlugin:
    """Tests for EditFilePlugin."""

    @pytest.fixture
    def plugin(self):
        return EditFilePlugin()

    @pytest.mark.asyncio
    async def test_edit_file_single_replacement(self, plugin):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("hello world")
            f.flush()
            temp_path = f.name

        try:
            result = await plugin.execute({
                "path": temp_path,
                "old_string": "world",
                "new_string": "python"
            })
            assert result.success is True
            assert result.data["replacements"] == 1
            assert Path(temp_path).read_text() == "hello python"
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_edit_file_old_string_not_found(self, plugin):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("hello world")
            f.flush()
            temp_path = f.name

        try:
            result = await plugin.execute({
                "path": temp_path,
                "old_string": "xyz",
                "new_string": "abc"
            })
            assert result.success is False
            assert "not found" in result.error
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_edit_file_multiple_occurrences_without_replace_all(self, plugin):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("hello hello hello")
            f.flush()
            temp_path = f.name

        try:
            result = await plugin.execute({
                "path": temp_path,
                "old_string": "hello",
                "new_string": "hi"
            })
            assert result.success is False
            assert "3 times" in result.error
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_edit_file_replace_all(self, plugin):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("hello hello hello")
            f.flush()
            temp_path = f.name

        try:
            result = await plugin.execute({
                "path": temp_path,
                "old_string": "hello",
                "new_string": "hi",
                "replace_all": True
            })
            assert result.success is True
            assert result.data["replacements"] == 3
            assert Path(temp_path).read_text() == "hi hi hi"
        finally:
            os.unlink(temp_path)


class TestListDirectoryPlugin:
    """Tests for ListDirectoryPlugin."""

    @pytest.fixture
    def plugin(self):
        return ListDirectoryPlugin()

    @pytest.mark.asyncio
    async def test_list_directory(self, plugin):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create some files and directories
            Path(tmpdir, "file1.txt").write_text("content1")
            Path(tmpdir, "file2.txt").write_text("content2")
            Path(tmpdir, "subdir").mkdir()
            
            result = await plugin.execute({"path": tmpdir})
            
            assert result.success is True
            entries = result.data["entries"]
            assert len(entries) == 3
            names = [e["name"] for e in entries]
            assert "file1.txt" in names
            assert "file2.txt" in names
            assert "subdir" in names

    @pytest.mark.asyncio
    async def test_list_nonexistent_directory(self, plugin):
        result = await plugin.execute({"path": "/nonexistent/directory"})
        assert result.success is False
        assert result.error is not None
