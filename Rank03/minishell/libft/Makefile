# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/05 19:48:28 by cpesty            #+#    #+#              #
#    Updated: 2026/02/17 14:30:29 by chlpesty         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# -*- MakeFile -*-

# Variables
NAME = libft.a
MY_SOURCES = ft_atoi.c \
	ft_bzero.c \
	ft_calloc.c \
	ft_get_next_line.c \
	ft_get_next_utils.c \
	ft_isalnum.c \
	ft_isalpha.c \
	ft_isascii.c \
	ft_isdigit.c \
	ft_isprint.c \
	ft_isspace.c \
	ft_isoperator.c \
	ft_wordlen.c \
	ft_itoa.c \
	ft_lstadd_back.c \
	ft_lstadd_front.c \
	ft_lstclear.c \
	ft_lstdelone.c \
	ft_lstiter.c \
	ft_lstlast.c \
	ft_lstmap.c \
	ft_lstnew.c \
	ft_lstsize.c \
	ft_memchr.c \
	ft_memcmp.c \
	ft_memcpy.c \
	ft_memmove.c \
	ft_memset.c \
	ft_printf_char.c \
	ft_printf_hexa.c \
	ft_printf_int.c \
	ft_printf_parse.c \
	ft_printf_pointer.c \
	ft_printf_string.c \
	ft_printf_uns_int.c \
	ft_printf_utils_2.c \
	ft_printf_utils.c \
	ft_printf_write.c \
	ft_printf.c \
	ft_putchar_fd.c \
	ft_putendl_fd.c \
	ft_putnbr_fd.c \
	ft_putstr_fd.c \
	ft_split.c \
	ft_strappend.c \
	ft_strchr.c \
	ft_strcmp.c \
	ft_strdup.c \
	ft_striteri.c \
	ft_strjoin.c \
	ft_strlcat.c \
	ft_strlcpy.c \
	ft_strlen.c \
	ft_strmapi.c \
	ft_strncmp.c\
	ft_strnstr.c \
	ft_strrchr.c \
	ft_strtrim.c \
	ft_substr.c \
	ft_tolower.c \
	ft_toupper.c
HEADERS = libft.h
MY_OBJECTS = $(MY_SOURCES:.c=.o)
CC = cc
CFLAGS = -Wall -Wextra -Werror -fPIC

#RULES
all: $(NAME)

$(NAME): $(MY_OBJECTS)
	@ar rcs $(NAME) $(MY_OBJECTS) 

.c.o:
	$(CC) $(CFLAGS) -c $< -o $@
	
clean:
	@rm -f $(MY_OBJECTS) $(BONUS_OBJ)

fclean: clean
	@rm -f $(NAME) 

re: fclean all

.PHONY: all clean fclean re
