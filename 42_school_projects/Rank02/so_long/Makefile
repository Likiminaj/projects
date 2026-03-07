CC = cc
CFLAGS = -Wall -Wextra -Werror
MLX_FLAGS = -L$(MLX_DIR) -lmlx -lXext -lX11 -lm
SRC_DIR = src
LIBFT_DIR = libft
HEADER_DIR = header
MLX_DIR = minilibx-linux

SRCS = $(SRC_DIR)/so_long.c \
       $(SRC_DIR)/ft_so_long_utils.c \
       $(SRC_DIR)/ft_check_map_content.c \
       $(SRC_DIR)/ft_check_path.c \
       $(SRC_DIR)/ft_error_and_exit_cases.c \
       $(SRC_DIR)/ft_mlx_setup.c \
       $(SRC_DIR)/ft_game_hooks.c \
       $(SRC_DIR)/ft_player_movement.c

OBJS = $(SRCS:.c=.o)
LIBFT = $(LIBFT_DIR)/libft.a
MLX_LIB = $(MLX_DIR)/libmlx.a
NAME = so_long

all: $(NAME)

$(NAME): $(LIBFT) $(MLX_LIB) $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) $(LIBFT) $(MLX_FLAGS) -o $(NAME)

$(LIBFT):
	make -C $(LIBFT_DIR)

$(MLX_LIB):
	make -C $(MLX_DIR)

%.o: %.c
	$(CC) $(CFLAGS) -I$(HEADER_DIR) -I$(LIBFT_DIR) -I$(MLX_DIR) -c $< -o $@

clean:
	rm -f $(OBJS)
	make -C $(LIBFT_DIR) clean
	make -C $(MLX_DIR) clean

fclean: clean
	rm -f $(NAME)
	make -C $(LIBFT_DIR) fclean

re: fclean all

.PHONY: all clean fclean re
