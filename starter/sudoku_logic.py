import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def count_solutions(board, limit=2):
    """
    Counts the number of valid solutions for a given board.
    # NOTE: We evaluated and rejected a basic random cell-removal approach 
    # because it could result in multiple valid solutions. 
    # Instead, we are using this optimized solver to ensure EXACTLY ONE unique solution.
    """
    row, col = -1, -1
    for i in range(SIZE):
        for j in range(SIZE):
            if board[i][j] == EMPTY:
                row, col = i, j
                break
        if row != -1:
            break
            
    if row == -1:
        return 1 
        
    count = 0
    for num in range(1, SIZE + 1):
        if is_safe(board, row, col, num):
            board[row][col] = num
            count += count_solutions(board, limit)
            board[row][col] = EMPTY
            if count >= limit:
                return count
                
    return count

def generate_puzzle(difficulty='medium'):
    if difficulty == 'easy':
        clues_to_remove = 30
    elif difficulty == 'hard':
        clues_to_remove = 50
    else: # medium
        clues_to_remove = 40
        
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    
    attempts = clues_to_remove
    positions = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(positions)
    
    for row, col in positions:
        if attempts <= 0:
            break
            
        backup = board[row][col]
        board[row][col] = EMPTY
        
        board_copy = deep_copy(board)
        if count_solutions(board_copy) != 1:
            board[row][col] = backup 
        else:
            attempts -= 1
            
    puzzle = deep_copy(board)
    return puzzle, solution
