import pytest
from sudoku_logic import deep_copy, create_empty_board, is_safe, fill_board, generate_puzzle, SIZE, EMPTY

def test_create_empty_board():
    board = create_empty_board()
    assert len(board) == SIZE
    assert len(board[0]) == SIZE
    assert all(cell == EMPTY for row in board for cell in row)

def test_deep_copy():
    board = create_empty_board()
    board[0][0] = 5
    board_copy = deep_copy(board)
    assert board_copy[0][0] == 5
    board_copy[0][0] = 9
    assert board[0][0] == 5  # Ensure original is unchanged

def test_is_safe():
    board = create_empty_board()
    board[0][0] = 5
    
    # Same row
    assert not is_safe(board, 0, 1, 5)
    # Same column
    assert not is_safe(board, 1, 0, 5)
    # Same 3x3 box
    assert not is_safe(board, 1, 1, 5)
    # Safe placement
    assert is_safe(board, 0, 1, 6)

def test_fill_board():
    board = create_empty_board()
    assert fill_board(board) == True
    # Ensure board is fully populated with valid numbers
    assert all(cell != EMPTY for row in board for cell in row)

def test_generate_puzzle():
    puzzle, solution = generate_puzzle('easy')
    assert len(puzzle) == SIZE
    assert len(solution) == SIZE
    assert any(cell == EMPTY for row in puzzle for cell in row)
    assert all(cell != EMPTY for row in solution for cell in row)
