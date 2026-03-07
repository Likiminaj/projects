#Variable
NAME = libftprintf.a
LIBFT_DIR = libft
LIBFT = $(LIBFT_DIR)/libft.a

MY_SOURCES = ft_printf.c \
	     ft_putadd_fd_mod.c \
	     ft_puthexl_fd_mod.c \
	     ft_putnbr_fd_mod.c \
	     ft_putstr_fd_mod.c \
	     ft_putchar_fd_mod.c \
	     ft_puthexu_fd_mod.c \
	     ft_putnbru_fd_mod.c

MY_OBJECTS = $(MY_SOURCES:.c=.o)

CC = cc
CFLAGS = -Wall -Werror -Wextra

#Rules
all: $(NAME)

$(LIBFT):
	@$(MAKE) -C $(LIBFT_DIR)

$(NAME): $(LIBFT) $(MY_OBJECTS)
	@ar rcs $(NAME) $(LIBFT) $(MY_OBJECTS)

clean:
	@rm -f $(MY_OBJECTS)
	@$(MAKE) clean -C $(LIBFT_DIR)

fclean: clean
	@rm -f $(NAME)
	@$(MAKE) fclean -C $(LIBFT_DIR)

re: fclean all

.PHONY: all clean fclean re
