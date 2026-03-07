/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   libft.h                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 14:48:06 by cpesty            #+#    #+#             */
/*   Updated: 2026/01/21 19:14:25 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef LIBFT_H
# define LIBFT_H

# include <stdlib.h>
# include <unistd.h>
# include <fcntl.h>
# include <stdarg.h>

# ifndef BUFFER_SIZE
#  define BUFFER_SIZE 10
# endif

typedef struct s_list
{
	void			*content;
	struct s_list	*next;
}	t_list;

typedef struct s_flags
{
	va_list	args;
	int		sign;
	int		left_justified;
	int		space;
	int		zero_pad;
	int		hash;
	int		width;
	int		dot;
	int		precision;
	char	specifier;
	int		cur_len;
	int		fin_len;
}				t_flags;

typedef struct s_hexa_param
{
	int		hexa_len;
	int		zero_pad;
	int		spaces;
}				t_hexa_param;

int				ft_isalpha(int c);
int				ft_isdigit(int c);
int				ft_isalnum(int c);
int				ft_isascii(int c);
int				ft_isprint(int c);
int				ft_isoperator(int c);
int				ft_isspace(char c);
int				ft_wordlen(char *str, int i);
size_t			ft_strlen(const char *s);
void			*ft_memset(void *s, int c, size_t n);
void			ft_bzero(void *s, size_t n);
void			*ft_memcpy(void *dest, const void *src, size_t n);
void			*ft_memmove(void *dest, const void *src, size_t n);
size_t			ft_strlcpy(char *dst, const char *src, size_t size);
size_t			ft_strlcat(char *dst, const char *src, size_t size);
int				ft_toupper(int c);
int				ft_tolower(int c);
char			*ft_strchr(const char *s, int c);
char			*ft_strrchr(const char *s, int c);
int				ft_strcmp(const char *s1, const char *s2);
int				ft_strncmp(const char *s1, const char *s2, size_t n);
void			*ft_memchr(const void *s, int c, size_t n);
int				ft_memcmp(const void *s1, const void *s2, size_t n);
char			*ft_strnstr(const char *big, const char *little, size_t len);
int				ft_atoi(const char *nptr);
void			*ft_calloc(size_t nmemb, size_t size);
char			*ft_strdup(const char *s);
char			*ft_strappend(char **s1, const char *s2);
char			*ft_substr(char const *s, unsigned int start, size_t len);
char			*ft_strjoin(char const *s1, char const *s2);
char			*ft_strtrim(char const *s1, char const *set);
char			**ft_split(char const *s, char c);
char			*ft_itoa(int n);
char			*ft_strmapi(char const *s, char (*f)(unsigned int, char));
void			ft_striteri(char *s, void (*f)(unsigned int, char*));
void			ft_putchar_fd(char c, int fd);
void			ft_putstr_fd(char *s, int fd);
void			ft_putendl_fd(char *s, int fd);
void			ft_putnbr_fd(int n, int fd);
t_list			*ft_lstnew(void *content);
void			ft_lstadd_front(t_list **lst, t_list *new);
int				ft_lstsize(t_list *lst);
t_list			*ft_lstlast(t_list *lst);
void			ft_lstadd_back(t_list **lst, t_list *new);
void			ft_lstdelone(t_list *lst, void (*del)(void*));
void			ft_lstclear(t_list **lst, void (*del)(void*));
void			ft_lstiter(t_list *lst, void (*f)(void *));
t_list			*ft_lstmap(t_list *lst, void *(*f)(void *),
					void (*del)(void *));

/* FT_PRINTF*/
const char		*ft_parse(const char *format, t_flags *flags);
void			ft_print_char(t_flags *flags);
void			ft_print_hexa(t_flags *flags);
void			ft_print_int(t_flags *flags);
void			ft_print_pointer(t_flags *flags);
void			ft_print_string(t_flags *flags);
void			ft_print_unsigned_int(t_flags *flags);
int				ft_printf(const char *format, ...);
const char		*ft_write_printf(const char *format, t_flags *flags);
int				ft_int_len(int i);
void			ft_str_reverse(char *str, int len);
void			ft_bzero(void *s, size_t n);
void			*ft_calloc_printf(size_t count, size_t size);
int				ft_strlen_printf(const char *str);
int				ft_unsigned_len(unsigned int num);
int				ft_atoi_printf(const char **format);
t_hexa_param	*ft_hexa_param_initialization(t_hexa_param *hexa_param);

/* GET_NEXT_LINE */
char			*get_next_line(int fd);
void			read_and_save(int fd, char **stash);
char			*save_in_stash(char *stash, char *buffer, int rbytes);
void			extract_line(char *stash, char **line);
char			*clean_stash(char *stash);
int				found_newline(char *stash);
void			create_line(char **line, char *stash);
void			free_stash(char **stash);
int				ft_strlen_gnl(const char *s);

#endif
